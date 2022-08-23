const express = require('express');

const userController = require('../app/controllers/userController');
const authController = require('../app/controllers/authController');
const userMiddleware = require('../app/middlewares/userMiddlewares');

const router = express.Router();

// AUTENTICAÇÃO
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/signup', userMiddleware.filterInsertInput, authController.signup);

// VERIFICA SE O USER TA LOGADO
router.route('/loggedIn').get(authController.isLoggedIn);

// EXIGE LOGIN PRA TODAS ROTAS ABAIXO
router.use(authController.protect);

// LISTAR TODOS USERS
router.route('/').get(userController.getAllUsers);

// PERFIL DO USER LOGADO
router.route('/me').get(userMiddleware.getMe, userController.getUser);

// AGENDAMENTOS DO USUÁRIO LOGADO
router
  .route('/me/appointments')
  .get(userMiddleware.getMe, userController.getUserAppointments);

// ATUALIZA DADOS
router
  .route('/me/updateProfile')
  .patch(
    userMiddleware.getMe,
    userMiddleware.filterUpdateInput,
    userController.updateUser
  );

// ATUALIZA SENHA
router.route('/me/updatePassword').patch(authController.updatePassword);

router.route('/:id').get(userController.getUser);

module.exports = router;
