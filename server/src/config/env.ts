import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/unidel_hrms',
  JWT_SECRET: process.env.JWT_SECRET || 'unidel_secure_jwt_key',
  AI_API_KEY: process.env.AI_API_KEY || '',
} as const;