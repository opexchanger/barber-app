const express = require('express');

const barberController = require('../app/controllers/barberController');
const authController = require('../app/controllers/authController');
const userMiddleware = require('../app/middlewares/userMiddlewares');
const barberMiddleware = require('../app/middlewares/barberMiddlewares');

const router = express.Router();

router
  .route('/')
  // LISTAR TODOS BARBEIROS
  .get(barberController.getAllBarbers)
  // CRIAR NOVA TABELA DE BARBEIRO
  .post(
    authController.protect,
    authController.restrictToBarber,
    userMiddleware.getId,
    barberController.createBarber
  );

// DADOS DO BARBEIRO LOGADO
router
  .route('/me')
  .get(
    authController.protect,
    authController.restrictToBarber,
    barberMiddleware.getMe,
    barberController.getBarber
  )
  .patch(
    authController.protect,
    authController.restrictToBarber,
    barberMiddleware.getMe,
    barberMiddleware.uploadBarberAvatar,
    barberMiddleware.resizeBarberAvatar,
    barberController.updateBarber
  );

// AGENDAMENTOS DO BARBEIRO LOGADO
router
  .route('/me/appointments')
  .get(
    authController.protect,
    authController.restrictToBarber,
    barberMiddleware.getMe,
    barberController.getBarberAppointments
  );

// ADICIONAR SERVIÇO AO BARBEIRO LOGADO
router
  .route('/me/services')
  .post(
    authController.protect,
    authController.restrictToBarber,
    barberMiddleware.getMe,
    barberMiddleware.validateService,
    barberController.addServiceToBarber
  );

// PEGAR BARBEIRO PELA ID
router.route('/:id').get(barberController.getBarber);

// PEGAR AGENDA DO BARBEIRO PELA ID
router
  .route('/:id/schedule')
  .get(
    barberMiddleware.validateBarberScheduleRequest,
    barberMiddleware.getBarberSchedule
  );

module.exports = router;
