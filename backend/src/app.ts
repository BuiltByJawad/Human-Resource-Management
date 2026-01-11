import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from '@/shared/middleware/errorHandler';
import { logger, stream } from '@/shared/config/logger';
import { rateLimiter } from '@/shared/middleware/security';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@/shared/config/swagger';
import { cookieMiddleware } from '@/shared/middleware/cookies';

export const prisma = new PrismaClient();

export const createApp = (): { app: Application; httpServer: any } => {
  const app = express();
  const httpServer = createServer(app);

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Set app variables
  app.set('trust proxy', 1);
  app.set('io', io);

  // Security Middleware
  app.use(
    helmet({
      // Avoid breaking Swagger UI and other embedded resources.
      contentSecurityPolicy: false,
    })
  );
  app.use(rateLimiter);

  app.use(compression());

  // CORS Configuration
  const corsOptions = {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'https://human-resource-management-b12l-qpg145xur.vercel.app',
      'https://human-resource-management-six.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-Slug'],
  };

  app.use(cors(corsOptions));

  // Handle preflight requests using the SAME config
  app.options('*', cors(corsOptions));

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookies (for httpOnly refresh tokens)
  app.use(cookieMiddleware);

  // Request logging
  app.use(morgan('combined', { stream }));


  // Prometheus metrics endpoint
  app.get('/metrics', async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production' && process.env.EXPOSE_METRICS !== 'true') {
      return res.status(404).json({ status: 'error', message: 'Not Found' });
    }
    try {
      const { register } = await import('@/shared/utils/metrics');
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).end();
    }
  });

  // API Documentation
  if (process.env.NODE_ENV !== 'production' || process.env.EXPOSE_API_DOCS === 'true') {
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'HRM API Documentation',
      })
    );
  }

  // Mount API routes
  app.use('/api', routes);

  // Health check endpoints
  app.get('/health', async (req: Request, res: Response) => {
    try {
      const health = await import('@/shared/utils/healthCheck');
      const status = await health.aggregateHealth();

      const httpStatus = status.status === 'healthy' ? 200 :
        status.status === 'degraded' ? 200 : 503;

      res.status(httpStatus).json(status);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  });

  // Liveness probe for Kubernetes
  app.get('/health/live', (req: Request, res: Response) => {
    res.status(200).json({
      alive: true,
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness probe for Kubernetes
  app.get('/health/ready', async (req: Request, res: Response) => {
    try {
      const health = await import('@/shared/utils/healthCheck');
      const readiness = await health.checkReadiness();

      if (readiness.ready) {
        res.status(200).json({
          ready: true,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          ready: false,
          reason: readiness.reason,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Readiness check failed';
      res.status(503).json({
        ready: false,
        reason: message,
        timestamp: new Date().toISOString(),
      });
    }
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
