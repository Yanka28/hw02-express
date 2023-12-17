import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import 'dotenv/config';
import nodemailer from 'nodemailer';
import router from './routes/api/contacts-router.js';
import authRouter from './routes/api/auth-router.js';

const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

// const { UKR_NET_PASSWORD, UKR_NET_EMAIL } = process.env;

// const nodemailerConfig = {
//   host: 'smtp.ukr.net',
//   port: 465, // 25, 465, 2525
//   secure: true,
//   auth: {
//     user: UKR_NET_EMAIL,
//     pass: UKR_NET_PASSWORD,
//   },
// };
// const transport = nodemailer.createTransport(nodemailerConfig);

// const email = {
//   from: UKR_NET_EMAIL,
//   to: 'miwayab263@arensus.com',
//   subject: 'Test email',
//   html: '<strong>Test email</strong>',
// };

// transport
//   .sendMail(email)
//   .then(() => console.log('Email send success'))
//   .catch(error => console.log(error.message));

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth', authRouter);
app.use('/api/contacts', router);

app.use((req, res) => {
  console.log(req.body);
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  const { status = 500, message = 'Server error' } = err;
  res.status(status).json({
    message,
  });
});

export default app;
