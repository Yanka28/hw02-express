import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import gravatar from 'gravatar';
import Jimp from 'jimp';
import { HttpError, sendEmail } from '../helpers/index.js';

import User from '../models/User.js';
import {
  userSignupSchema,
  userSigninSchema,
  userSubscriptionSchema,
  userAvatarsSchema,
  userEmailSchema,
} from '../models/User.js';
import { write } from 'fs';

const avatarsPath = path.resolve('public', 'avatars');

const { JWT_SECRET, BASE_URL } = process.env;

const signup = async (req, res, next) => {
  try {
    const { error } = userSignupSchema.validate(req.body);
    if (error) {
      throw HttpError(400, error.message);
    }
    const { email, password } = req.body;

    const avatarURL = gravatar.url(
      email,
      { s: '250', r: 'x', d: 'retro' },
      false
    );

    const user = await User.findOne({ email });
    if (user) {
      throw HttpError(409, 'Email already exist');
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const verificationToken = nanoid();
    const result = await User.create({
      ...req.body,
      password: hashPassword,
      avatarURL: avatarURL,
      verificationToken,
    });
    const verifyEmail = {
      to: email,
      subject: 'Verify email',
      html: `<a target="_blank" href="${BASE_URL}/api/auth/users/verify/${verificationToken}">Click verify email</a>`,
    };
    await sendEmail(verifyEmail);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const verify = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });

  console.log('verify', verificationToken);
  console.log('user', user);
  if (!user) {
    throw HttpError(401, 'Email not found');
  }

  await User.updateOne(
    { verificationToken },
    { verify: true, verificationToken: null }
  );
  res.json({
    message: 'Email verify success',
  });
};

const resendVerify = async (req, res, next) => {
  try {
    const { error } = userEmailSchema.validate(req.body);
    if (error) {
      throw HttpError(400, 'missing field subscription');
    }
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw HttpError(401, 'Email not found');
    }
    if (user.verify) {
      throw HttpError(400, 'Email already verify');
    }
    const verifyEmail = {
      to: email,
      subject: 'Verify email',
      html: `<a target="_blank" href="${BASE_URL}/api/auth/users/verify/${user.verificationToken}">Click verify email</a>`,
    };

    await sendEmail(verifyEmail);

    res.json({
      message: 'Email send success',
    });
  } catch (error) {
    next(error);
  }
};

const signin = async (req, res, next) => {
  try {
    const { error } = userSigninSchema.validate(req.body);
    if (error) {
      throw HttpError(400, error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw HttpError(401, 'Email or password invalid');
    }

    if (!user.verify) {
      throw HttpError(401, 'Email not verify');
    }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      throw HttpError(401, 'Email or password invalid');
    }
    const payload = {
      id: user._id,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '23h' });
    await User.findByIdAndUpdate(user._id, { token });

    res.status(201).json({
      token,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrent = async (req, res) => {
  const { email } = req.user;
  res.json({
    email,
  });
};
const updateSubscription = async (req, res, next) => {
  try {
    const { error } = userSubscriptionSchema.validate(req.body);
    if (error) {
      throw HttpError(400, 'missing field subscription');
    }
    const { _id } = req.user;
    const result = await User.findOneAndUpdate({ _id }, req.body);
    if (!result) {
      throw HttpError(404, `User with id=${id} not found`);
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
};
const updateAvatars = async (req, res, next) => {
  try {
    const { error } = userAvatarsSchema.validate(req.body);
    if (error) {
      throw HttpError(400, 'missing field avatarURL');
    }
    const { _id } = req.user;
    const { path: oldPath } = req.file;

    const newName = `${req.user.email.split('@')[0]}` + '.jpg';
    Jimp.read(`${oldPath}`, (err, avatar) => {
      if (err) throw err;
      avatar.resize(50, 50).write(newName);
    });

    const newPath = path.join(avatarsPath, newName);

    await fs.rename(oldPath, newPath);
    const avatarURL = path.join('avatars', newName);

    const result = await User.findOneAndUpdate(
      { _id },
      { ...req.body, avatarURL: avatarURL }
    );
    if (!result) {
      throw HttpError(404, `User with id=${id} not found`);
    }
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: '' });

  res.json({
    message: 'Signout success',
  });
};

export default {
  signup,
  verify,
  signin,
  getCurrent,
  logout,
  updateSubscription,
  updateAvatars,
  resendVerify,
};
