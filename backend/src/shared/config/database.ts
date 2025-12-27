import { PrismaClient } from '@prisma/client'
import { createClient } from 'redis'
import winston from 'winston'
import { config } from 'dotenv'
import path from 'path'

config()

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined
}

export const prisma = global.prismaGlobal || new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma
}

// Redis client with error handling
export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  }
})

// Handle Redis errors gracefully
redis.on('error', (err) => {
  logger.warn('Redis Client Error:', err)
})

redis.on('connect', () => {
  logger.info('Redis Client Connected')
})

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hrm-backend' },
  transports: [
    ...(process.env.NODE_ENV === 'development'
      ? [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ]
      : []),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
})

export const connectDatabases = async () => {
  try {
    try {
      await prisma.$connect()
      logger.info('PostgreSQL connected successfully')
    } catch (err: any) {
      const name = String(err?.name || '')
      const code = String(err?.errorCode || err?.code || '')

      // Prisma P1001: Can't reach database server
      if (name === 'PrismaClientInitializationError' && code === 'P1001') {
        const rawUrl = process.env.DATABASE_URL || ''
        try {
          const u = new URL(rawUrl)
          const host = u.hostname
          const port = u.port || '5432'
          logger.warn('Initial DB connection failed (P1001)', { host, port })

          if (host === 'localhost') {
            u.hostname = '127.0.0.1'
            process.env.DATABASE_URL = u.toString()
            logger.warn('Retrying DB connection with 127.0.0.1', { port })
            await prisma.$disconnect().catch(() => undefined)
            await prisma.$connect()
            logger.info('PostgreSQL connected successfully (fallback host)')
          } else if (host === '127.0.0.1') {
            u.hostname = 'localhost'
            process.env.DATABASE_URL = u.toString()
            logger.warn('Retrying DB connection with localhost', { port })
            await prisma.$disconnect().catch(() => undefined)
            await prisma.$connect()
            logger.info('PostgreSQL connected successfully (fallback host)')
          } else {
            throw err
          }
        } catch {
          throw err
        }
      } else {
        throw err
      }
    }

    // Try to connect to Redis, but don't fail if it's not available
    /*
    try {
      await redis.connect()
      logger.info('Redis connected successfully')
    } catch (redisError) {
      logger.warn('Redis connection failed, continuing without Redis:', redisError)
    }
    */
    logger.info('Skipping Redis connection for now')
  } catch (error) {
    logger.error('Database connection failed:', error)
    process.exit(1)
  }
}

export const disconnectDatabases = async () => {
  await prisma.$disconnect()
  try {
    await redis.disconnect()
  } catch (error) {
    logger.warn('Redis disconnection error:', error)
  }
}