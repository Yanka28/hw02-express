import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { HttpError } from '../helpers/index.js';
import gravatar from 'gravatar';
import User from '../models/User.js';
import {
  userSignupSchema,
  userSigninSchema,
  userSubscriptionSchema,
  userAvatarsSchema,
} from '../models/User.js';

const avatarsPath = path.resolve('public', 'avatars');

const { JWT_SECRET } = process.env;

const signup = async (req, res, next) => {
  try {
    const { error } = userSignupSchema.validate(req.body);
    if (error) {
      throw HttpError(400, error.message);
    }
    const { email, password } = req.body;
    const avatarURL = gravatar.url(
      email,
      { s: '200', r: 'x', d: 'retro' },
      false
    );
    console.log(avatarURL);
    const user = await User.findOne({ email });
    if (user) {
      throw HttpError(409, 'Email already exist');
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const result = await User.create({
      ...req.body,
      password: hashPassword,
      avatarURL: avatarURL,
    });
    res.status(201).json(result);
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
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      throw HttpError(401, 'Email or password invalid');
    }
    const payload = {
      id: user._id,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '23h' });
    await User.findByIdAndUpdate(user._id, { token });

    res.json({
      token,
    });
    // res.status(201).json(result);
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
    console.log(req.user);
    const result = await User.findOneAndUpdate({ _id }, req.body);
    console.log(result);
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
    // const { _id: owner } = req.user;
    //   const { path: oldPath, filename } = req.file;
    //   const newPath = path.join(postersPath, filename);
    //   await fs.rename(oldPath, newPath);

    //   const poster = path.join('posters', filename);
    //   const result = await Movie.create({ ...req.body, poster, owner });

    //   res.status(201).json(result);
    const { _id } = req.user;
    const { path: oldPath, filename } = req.file;
    const newPath = path.join(avatarsPath, filename);
    console.log(avatarsPath);
    await fs.rename(oldPath, newPath);
    const avatarURL = path.join('avatars', filename);
    // const result = await Movie.create({ ...req.body, poster, owner });
    console.log(req.body);
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
  signin,
  getCurrent,
  logout,
  updateSubscription,
  updateAvatars,
};
