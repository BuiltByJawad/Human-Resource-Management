import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Define environment variable schema
const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(5000),
    BACKEND_URL: Joi.string().allow('').default('http://localhost:5000').description('Backend URL'),
    FRONTEND_URL: Joi.string().allow('').default('http://localhost:3000').description('Frontend URL'),
    DATABASE_URL: Joi.string().required().description('Database connection URL'),
    REDIS_URL: Joi.string().description('Redis connection URL'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_REFRESH_SECRET: Joi.string().required().description('JWT refresh secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('Minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('Days after which refresh tokens expire'),
    ENCRYPTION_KEY: Joi.string().required().description('Encryption key'),
    MAX_FILE_SIZE: Joi.number().default(5 * 1024 * 1024).description('Maximum file size in bytes'),
    UPLOAD_PATH: Joi.string().default('uploads').description('File upload directory'),
    LOG_LEVEL: Joi.string().default('info').description('Logging level'),
    LOG_FILE_PATH: Joi.string().default('logs').description('Log file directory'),
    SMTP_HOST: Joi.string().description('Server that will send the emails'),
    SMTP_PORT: Joi.number().description('Port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('Username for email server'),
    SMTP_PASSWORD: Joi.string().description('Password for email server'),
    EMAIL_FROM: Joi.string().description('The from field in the emails sent by the app'),
  })
  .unknown();

// Validate environment variables
const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Export config object
const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  backendUrl: envVars.BACKEND_URL,
  frontendUrl: envVars.FRONTEND_URL,
  database: {
    url: envVars.DATABASE_URL,
    ssl: envVars.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
  redis: {
    url: envVars.REDIS_URL,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    cookieOptions: {
      httpOnly: true,
      secure: envVars.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  },
  encryptionKey: envVars.ENCRYPTION_KEY,
  fileUpload: {
    maxSize: envVars.MAX_FILE_SIZE,
    uploadPath: path.join(process.cwd(), envVars.UPLOAD_PATH),
  },
  logging: {
    level: envVars.LOG_LEVEL,
    logFilePath: envVars.LOG_FILE_PATH,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM || `HRM System <noreply@hrm.com>`,
  },
  cors: {
    origin: envVars.FRONTEND_URL,
    credentials: true,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  },
} as const;

export default config;

// Export individual configs for easier imports
export const {
  env: NODE_ENV,
  port: PORT,
  backendUrl: BACKEND_URL,
  frontendUrl: FRONTEND_URL,
  database: { url: DATABASE_URL },
  redis: { url: REDIS_URL },
  jwt: { secret: JWT_SECRET, refreshSecret: JWT_REFRESH_SECRET },
  logging: { level: LOG_LEVEL, logFilePath: LOG_FILE_PATH },
} = config;
