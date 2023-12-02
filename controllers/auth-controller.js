import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { HttpError } from '../helpers/index.js';
import User from '../models/User.js';
import {
  userSignupSchema,
  userSigninSchema,
  userSubscriptionSchema,
} from '../models/User.js';

const { JWT_SECRET } = process.env;

const signup = async (req, res, next) => {
  try {
    const { error } = userSignupSchema.validate(req.body);
    if (error) {
      throw HttpError(400, error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw HttpError(409, 'Email already exist');
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const result = await User.create({ ...req.body, password: hashPassword });
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
    console.log(req.body);
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

// const updateStatusContact = async (req, res, next) => {
//   try {
//     const { error } = contactFavoriteSchema.validate(req.body);
//     if (error) {
//       throw HttpError(400, 'missing field favorite');
//     }
//     const { id } = req.params;
//     const { _id: owner } = req.user;
//     const result = await Contact.findOneAndUpdate({ _id: id, owner }, req.body);
//     if (!result) {
//       throw HttpError(404, `Contact with id=${id} not found`);
//     }
//     res.json(result);
//   } catch (error) {
//     next(error);
//   }
// };

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
};
