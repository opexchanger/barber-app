const AppError = require('../../utils/appError');

// FUNÇÃO ENVIA ERRO NO AMBIENTE DE DESENVOLVIMENTO
const sendErrorDev = (res, error) => {
  console.log(error);
  res.status(error.statusCode).json({
    status: error.status,
    error,
    message: error.message,
    stack: error.stack,
  });
};

// FUNÇÃO ENVIA ERRO NO AMBIENTE DE PRODUÇÃO
const sendErrorProd = (res, error) => {
  console.log('SendErrorProd ->');
  console.log(error.message);
  // SE FOR UM DOS NOSSOS 'ERROS PREVISTOS' OU OUTROS QUE NÃO SEJAM DO TIPO 'SERVER ERROR'
  if (error.isOperational || !`${error.statusCode}`.startsWith('5')) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
    // SE FOR ERRO DESCONHECIDO
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong with the server',
    });
  }
};

// const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// FUNÇÕES DE TRADUZIR ERROS ESPECÍFICOS DO SEQUELIZE
const handleConstraintError = (err) => {
  return new AppError(err.errors[0].message, '400');
};

const handleValidationError = (err) => {
  // const msg = String(err.message).split(': ')[1];
  return new AppError(err.errors[0].message, '400');
};

// MIDDLEWARE QUE PEGA TODOS ERROS DA APLICAÇÃO
module.exports = (err, req, res, next) => {
  console.log('_______________ERROR CONTROLLER________________');
  console.log(err);
  // SE NÃO VIER COM FORMATO PADRÃO APLICA 500 (ERRO DESCONHECIDO)
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // SELECIONA O AMBIENTE DE DESENVOLVIMENTO
  if (process.env.NODE_ENV === 'development') {
    console.log('Handle Error in DEVELOPMENT ->');
    sendErrorDev(res, err);
  } else if (
    process.env.NODE_ENV === 'production' ||
    process.env.NODE_ENV === 'test'
  ) {
    console.log('Handle Error in PRODUCTION ->');
    console.log(`error name: ${err.name}`);
    console.log(`error message: ${err.message}`);
    let error;
    // Tenta achar um erro de client previsto
    if (err.name === 'SequelizeUniqueConstraintError')
      error = handleConstraintError(err);
    if (err.name === 'SequelizeValidationError')
      error = handleValidationError(err);

    // Se não pegou nenhum dos ifs volta a ser o erro original
    error = error || err;

    sendErrorProd(res, error);
  }
};
