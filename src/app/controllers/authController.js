const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const User = require('../models/User');
const AppError = require('../../utils/appError');
const { catchAsync } = require('../../utils/functions');

// FUNÇÃO CRIAR O TOKEN JWT
const getToken = async (id) => {
  const token = await promisify(jwt.sign)({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

// FUNÇÃO EXECITAR O LOGIN
const logUserIn = catchAsync(async (user, statusCode, res) => {
  // CRIA TOKEN DO USUÁRIO
  const token = await getToken(user.id);

  // CONFIGURA O COOKIE Q VAI MANDAR NA RESPONSE
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 // converte dias em ms
    ),
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  };

  res.cookie('jwt', token, cookieOptions);

  // REMOVE CAMPOS SECRETOS DA RESPOSTA
  user.password_hash = undefined;
  user.admin = user.admin ? user.admin : undefined;
  user.deleted_at = undefined;
  user.company_id = undefined;

  // ENVIA CONFIRMAÇÃO DE LOGIN C TOKEN E USER
  res.status(statusCode).json({
    status: 'success',
    token,
    data: user,
  });
});

// * MIDDLEWARE SIGNUP * //
exports.signup = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);

  logUserIn(user, 201, res);
});

// * MIDDLEWARE LOGIN * //
exports.login = catchAsync(async (req, res, next) => {
  // DESTRUCTURING DOS CAMPOS QUE PRECISA
  const { email, password } = req.body;

  // TEM QUE TER PREENCHIDO AMBOS
  if (!email || !password)
    return next(new AppError('Informe email e senha', 400));

  // CHECA SE É STRING (se não for buga o bcrypt e o sequelize)
  if (typeof email !== 'string' || typeof password !== 'string')
    return next(
      new AppError('Senha e e-mail devem estar no formato string', 400)
    );

  // PEGA O USER COM A SENHA
  const user = await User.findOne({
    where: { email },
    attributes: { include: ['password_hash', 'admin'] },
  });

  // VERIFICA SE USER EXISTE E SE SENHA ESTÁ CORRETA
  if (!user || !(await user.comparePasswords(password))) {
    return next(new AppError('Senha ou email incorretos', 401));
  }

  // PASSA O USER PRA JSON PRA MANIPULAR MELHOR
  const userObject = user.toJSON();

  // INFORMA O STATUS DO REGISTRO DE BARBEIRO
  if (user.role === 'barber') {
    const barberRegister = await user.getBarber();
    userObject.barberStatus = !!barberRegister;
  }

  // TENDO PASSADO TODOS OS TESTES CHAMA FUNÇÃO LOGIN
  logUserIn(userObject, 200, res);
});

// * MIDDLEWARE PROTECT * //
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // VERIFICA SE O TOKEN DE AUTORIZAÇÃO FOI ENVIADO
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt && !req.cookies.jwt.startsWith('loggedout')) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('Você precisa estar logado para acessar essa área', 401)
    );
  }

  // VERIFICA SE O TOKEN É VÁLIDO E NÃO EXPIRADO
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // VERIFICA SE O USER ASSOC. AO TOKEN AINDA EXISTE (prevenir roubo)
  const user = await User.findByPk(decoded.id, {
    attributes: ['id', 'name', 'email', 'role', 'admin', 'company_id'],
  });
  if (!user) {
    return next(
      new AppError('O usuário associado ao token de login não existe mais', 401)
    );
  }

  // TODO VERIFICAR SE O USER NÃO TROCOU A SENHA (token antigo fica invalidado)
  // if (await user.changedPassword(decoded.iat)) {
  //   return next(
  //     new AppError('User password has changed. Please log in again.', 401)
  //   );
  // }

  // GUARDA O USER PRO RESTANTE DA APLICAÇÃO PODER ACESSAR
  res.locals.user = user.toJSON();
  res.locals.company = user.company_id;

  // E SE FOR BARBEIRO GUARDA OS DADOS DELE TAMBÉM
  const barber = await user.getBarber();
  if (barber) res.locals.barber = barber.toJSON();

  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findByPk(decoded.id);
      if (!currentUser) {
        return res.status(200).json({ status: 'success', loggedIn: false });
      }

      // TODO
      // 3) Check if user changed password after the token was issued
      // if (currentUser.changedPasswordAfter(decoded.iat)) {
      //   return res.status(200).json({ status: 'success', loggedIn: false });
      // }

      // THERE IS A LOGGED IN USER
      return res
        .status(200)
        .json({ status: 'success', loggedIn: true, data: currentUser });
    } catch (err) {
      return res.status(200).json({ status: 'success', loggedIn: false });
    }
  }
  return res.status(200).json({ status: 'success', loggedIn: false });
};

// * MIDDLEWARE RESTRICT * //
exports.restrictToAdmin = (req, res, next) => {
  if (!res.locals.user.admin) {
    return next(new AppError('Você não possui permissão para essa ação', 403));
  }
  next();
};

exports.restrictToBarber = (req, res, next) => {
  if (res.locals.user.role !== 'barber') {
    return next(new AppError('Você não possui permissão para essa ação', 403));
  }

  next();
};

// * MIDDLEWARE LOGOUT * //
exports.logout = (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });

  res.status(200).json({
    status: 'success',
  });
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, password, confirmPassword } = req.body;
  // CAMPOS OBRIGATÓRIOS
  if (!currentPassword || !password || !confirmPassword) {
    return next(
      new AppError(
        'Por favor informe todos os campos (currentPassword, password e confirmPassword)',
        400
      )
    );
  }

  // parece que devia ter uma validação mais decente nesses inputs
  // CHECA SE É STRING (se não for buga o bcrypt e o sequelize)
  if (
    typeof currentPassword !== 'string' ||
    typeof password !== 'string' ||
    typeof confirmPassword !== 'string'
  )
    return next(new AppError('Campos devem estar no formato string', 400));

  // GET user logged
  const user = await User.findByPk(res.locals.user.id, {
    attributes: { include: ['password_hash', 'password', 'confirm_password'] },
  });

  if (!user)
    return next(
      new AppError('Erro nas suas credenciais. Faça login novamente', 401)
    );

  // CHECK provided password
  if (!(await user.comparePasswords(currentPassword)))
    return next(new AppError('Senha informada incorreta', 401));

  // UPDATE password
  user.password = password;
  user.confirm_password = confirmPassword;
  console.log(user);
  await user.save();
  // LOGAR o user com a senha nova
  logUserIn(user, 200, res);
});

// exports.forgotPassword = catchAsync(async (req, res, next) => {
//   //VERIFICA se o email existe
//   const user = await User.findOne({ email: req.body.email });
//   if (!user) {
//     return next(new AppError('There is no user with this email', 404));
//   }

//   //GERA o token de reset e salva no user
//   const resetToken = user.createResetPasswordToken();
//   await user.save({ validateBeforeSave: false });

//   //PREPARA pra enviar o token
//   const resetUrl = `${req.protocol}://${req.get(
//     'host'
//   )}/api/v1/users/${resetToken}`;

//   const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetUrl}\nIf you didn't required a password change, please ignore this email.`;

//   try {
//     await sendEmail({
//       email: user.email,
//       subject: 'Your Natours password reset (valid for 10 minutes)',
//       message,
//     });

//     res.status(200).json({
//       status: 'success',
//       message: 'Reset link was sent to your email',
//     });
//   } catch (err) {
//     user.passwordResetToken = undefined;
//     user.passwordResetExpires = undefined;
//     await user.save({ validateBeforeSave: false });

//     console.log(err);

//     return next(
//       new AppError(
//         'There was an error sending the email. Please try again later.',
//         500
//       )
//     );
//   }
// });

// exports.resetPassword = catchAsync(async (req, res, next) => {
//   //PEGAR o user pelo token que a data ainda não expirou
//   const passwordResetToken = crypto
//     .createHash('sha256')
//     .update(req.params.token)
//     .digest('hex');

//   const user = await User.findOne({
//     passwordResetToken,
//     passwordResetExpires: { $gt: Date.now() },
//   });

//   if (!user) {
//     return next(new AppError('Token is invalid or has expirated', 400));
//   }

//   //SETAR nova senha
//   user.password = req.body.password;
//   user.confirmPassword = req.body.confirmPassword;
//   user.passwordResetToken = undefined;
//   user.passwordResetExpires = undefined;
//   await user.save();

//   //LOGAR o user
//   logUserIn(user, 200, res);
// });
