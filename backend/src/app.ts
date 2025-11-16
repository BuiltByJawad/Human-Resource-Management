import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { initializePassport } from './config/passport';
import { logger, stream } from './config/logger';
import routes from './routes';

export const prisma = new PrismaClient();

export const createApp = (): { app: Application; httpServer: any } => {
  const app = express();
  const httpServer = createServer(app);
  
  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Set app variables
  app.set('trust proxy', 1);
  app.set('io', io);

  // Middleware
  app.use(helmet());
  app.use(compression());
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  }));
  
  // Request logging
  app.use(morgan('combined', { stream }));
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });
  
  app.use(limiter);
  
  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  
  // Initialize Passport
  initializePassport(app);
  
  // API routes
  app.use('/api', routes);
  
  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      status: 'error',
      message: 'Not Found',
    });
  });
  
  // Error handler
  app.use(errorHandler);
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    // Close server & exit process
    httpServer.close(() => process.exit(1));
  });
  
  return { app, httpServer };
};
