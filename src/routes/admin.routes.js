const router = require('express').Router();

const authController = require('../app/controllers/authController');
const userController = require('../app/controllers/userController');
const userMiddleware = require('../app/middlewares/userMiddlewares');

router.use(authController.protect);
router.use(authController.restrictToAdmin);

router.route('/users').post(userController.createUser);
router
  .route('/barbers')
  .get(userMiddleware.onlyBarbers, userController.getUserBarbers);

module.exports = router;
