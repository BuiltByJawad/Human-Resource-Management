import { PrismaClient } from '@prisma/client'
import { createClient } from 'redis'
import winston from 'winston'
import { config } from 'dotenv'

config()

export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

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
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
})

export const connectDatabases = async () => {
  try {
    await prisma.$connect()
    logger.info('PostgreSQL connected successfully')

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