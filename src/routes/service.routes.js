const express = require('express');

const serviceController = require('../app/controllers/serviceController');
const serviceMiddleware = require('../app/middlewares/serviceMiddlewares');
const authController = require('../app/controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(serviceController.getAllServices)
  .post(authController.restrictToAdmin, serviceController.createService);

router
  .route('/:id')
  .get(serviceController.getService)
  .patch(
    authController.restrictToAdmin,
    serviceMiddleware.checkService,
    serviceMiddleware.uploadServiceIcon,
    serviceMiddleware.resizeServiceIcon,
    serviceController.updateService
  )
  .delete(authController.restrictToAdmin, serviceController.deleteService);

module.exports = router;
