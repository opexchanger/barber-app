const User = require('../models/User');
const { catchAsync } = require('../../utils/functions');
const factory = require('./handlerFactory');

exports.createUser = factory.createOne(User);
exports.getUser = factory.getOne(User, 'usuário');
exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User);

exports.getUserBarbers = catchAsync(async (req, res, next) => {
  const users = await User.findAll({ where: { role: 'barber' } });

  const usersWithBarbers = await Promise.all(
    users.map((user) =>
      user.getBarber().then((barber) => {
        const userObject = user.toJSON();
        if (barber) userObject.barber = barber.toJSON();
        return userObject;
      })
    )
  );

  res.status(200).json({
    status: 'success',
    data: usersWithBarbers,
  });
});

/**
 * GET USER APPOINTMENTS
 */
exports.getUserAppointments = catchAsync(async (req, res, next) => {
  // BUSCA O USUÁRIO LOGADO
  const user = await User.findByPk(res.locals.user.id);

  // BUSCA OS AGENDAMENTOS DO USUÁRIO PARA ESSE DIA
  const appointments = await user.getAppointments({
    where: {
      status: 'pendente',
    },
    include: [
      {
        association: 'barber',
        attributes: ['id', 'user_id', 'avatar'],
        include: [
          {
            association: 'user',
            attributes: ['name', 'phone_number'],
          },
        ],
      },
      {
        association: 'service',
        attributes: ['name'],
      },
    ],
  });

  res.status(200).json({
    status: 'success',
    data: appointments,
  });
});
