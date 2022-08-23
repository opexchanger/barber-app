const express = require('express');
const { resolve } = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
// const { shouldSendSameSiteNone } = require('should-send-same-site-none');

const AppError = require('./utils/appError');

require('./config/enviroment');
require('./database/index');

const userRouter = require('./routes/user.routes');
const barberRouter = require('./routes/barber.routes');
const adminRouter = require('./routes/admin.routes');
const serviceRouter = require('./routes/service.routes');
const appointmentRouter = require('./routes/appointment.routes');
const globalErrorHandler = require('./app/controllers/errorController');

const app = express();

// definição do rate limiter
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 20,
  message:
    'Calma lá patrão, 100 requests já nos últimos 20 minutos. Agora vai ter que esperar um pouco...',
});

// MIDDLEWARES
// set security http headers
app.use(helmet());
// manage origins access
app.use(
  cors({
    credentials: true,
    origin: [
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501',
      'http://localhost:8080',
      'https://flexbarberson.web.app/',
    ],
  })
);
// parse body and limit req. size
app.use(express.json({ limit: '10kb' }));
// parse cookies
app.use(cookieParser());
// serve the static files
app.use('/public', express.static(resolve(__dirname, '..', 'temp')));
// limit requests from same ip
app.use(limiter);
// confere incompatibilidade do browser com cookie config
// app.use(shouldSendSameSiteNone);

// ROUTES
app.use('/api/v1/users', userRouter);
app.use('/api/v1/barbers', barberRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/services', serviceRouter);
app.use('/api/v1/appointments', appointmentRouter);

// ÚLTIMA INSTÂNCIA SE CHEGOU AQUI A ROTA NÃO EXISTE
app.use((req, res, next) => {
  next(new AppError(`Rota ${req.originalUrl} não encontrada`, 404));
});

// PEGA TODOS OS ERROS
app.use(globalErrorHandler);

module.exports = app;
