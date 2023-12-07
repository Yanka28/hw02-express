import express from 'express';
import { authenticate, isEmptyBody, upload } from '../../middlewares/index.js';
import authController from '../../controllers/auth-controller.js';

const authRouter = express.Router();

authRouter.post('/users/register', isEmptyBody, authController.signup);

authRouter.post('/users/login', isEmptyBody, authController.signin);

authRouter.get('/users/current', authenticate, authController.getCurrent);

authRouter.post('/users/logout', authenticate, authController.logout);

authRouter.patch('/users', authenticate, authController.updateSubscription);

authRouter.patch(
  '/users/avatars',
  upload.single('avatarURL'),
  authenticate,
  authController.updateAvatars
);

export default authRouter;
