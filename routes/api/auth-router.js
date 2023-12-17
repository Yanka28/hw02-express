import express from 'express';

import authController from '../../controllers/auth-controller.js';

import { authenticate, isEmptyBody, upload } from '../../middlewares/index.js';

import { validateBody } from '../../decorators/index.js';

import {
  userSignupSchema,
  userSigninSchema,
  userSubscriptionSchema,
  userAvatarsSchema,
  userEmailSchema,
} from '../../models/User.js';

const authRouter = express.Router();

authRouter.post(
  '/users/register',
  isEmptyBody,
  validateBody(userSignupSchema),
  authController.signup
);

authRouter.get('/users/verify/:verificationToken', authController.verify);

authRouter.post(
  '/users/verify',
  isEmptyBody,
  validateBody(userEmailSchema),
  authController.resendVerify
);

authRouter.post(
  '/users/login',
  isEmptyBody,
  validateBody(userSigninSchema),
  authController.signin
);

authRouter.get('/users/current', authenticate, authController.getCurrent);

authRouter.post('/users/logout', authenticate, authController.logout);

authRouter.patch(
  '/users',
  authenticate,
  validateBody(userSubscriptionSchema),
  authController.updateSubscription
);

authRouter.patch(
  '/users/avatars',
  upload.single('avatarURL'),
  authenticate,
  validateBody(userAvatarsSchema),
  authController.updateAvatars
);

export default authRouter;
