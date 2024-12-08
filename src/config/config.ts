import dotenv from 'dotenv';
dotenv.config();

export const config = {
  mongoURI: process.env.MONGO_URI!,
  jwtSecret: process.env.JWT_SECRET!,
  emailUser: process.env.EMAIL_USER!,
  emailPass: process.env.EMAIL_PASS!,
};
