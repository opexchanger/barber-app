const router = require('express').Router();

const appointmentController = require('../app/controllers/appointmentController');
const appointmentMiddleware = require('../app/middlewares/appointmentMiddleware');
const authController = require('../app/controllers/authController');

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictToAdmin, appointmentController.getAllAppointments)
  .post(
    appointmentMiddleware.filterInput,
    appointmentMiddleware.validateHour,
    appointmentMiddleware.getServiceData,
    appointmentMiddleware.getUser,
    appointmentController.createAppointment
  );

router.route('/:id').delete(appointmentController.deleteAppointment);

module.exports = router;
