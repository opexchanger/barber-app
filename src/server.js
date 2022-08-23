// CATCH ALL PROCESS EXCEPTIONS
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  console.log(err);
  process.exit(1);
});

const app = require('./app');

const server = app.listen(3000, () => {
  console.log('server is running...');
});

// FUNÇÃO PRA CHAMAR NO CRASH DO SERVER
// TODO deve reiniciar o server
const shutdown = (message, err) => {
  console.log(err.name, err.message);
  console.log(message);
  server.close(() => {
    process.exit(1);
  });
};

// REJECTIONS QUE NÃO FORAM PEGAS
process.on('unhandledRejection', (err) => {
  shutdown('UNHANDLED REJECTION! Shutting down...', err);
});
