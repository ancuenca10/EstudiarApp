import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || '3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

export const getJwtSecret = () => {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET no esta configurado en variables de entorno');
  }

  return env.jwtSecret;
};
