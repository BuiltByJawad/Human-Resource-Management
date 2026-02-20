import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { redis, logger } from '../../shared/config/database'
import config from '../../shared/config/config'

export const generateToken = (length = 32) => crypto.randomBytes(length).toString('hex')

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

export const ensureRedisConnected = async (): Promise<boolean> => {
  try {
    if (redis.isOpen) return true
    await redis.connect()
    return true
  } catch (error) {
    logger.warn('Redis unavailable for refresh token rotation, continuing without rotation', { error })
    return false
  }
}

export const verifyRefreshToken = (refreshToken: string): { userId?: string; jti?: string; iat?: number; email?: string } => {
  return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
    userId?: string
    jti?: string
    iat?: number
    email?: string
  }
}

const refreshJtiKey = (userId: string, jti: string) => `auth:refresh:jti:${userId}:${jti}`

export const storeRefreshJti = async (userId: string, jti: string): Promise<void> => {
  const refreshDays =
    typeof config.jwt.refreshExpirationDays === 'number' && Number.isFinite(config.jwt.refreshExpirationDays)
      ? config.jwt.refreshExpirationDays
      : 7
  const ttlSeconds = Math.max(1, Math.floor(refreshDays * 24 * 60 * 60))
  await redis.set(refreshJtiKey(userId, jti), '1', { EX: ttlSeconds })
}

export const rotateRefreshJtiIfPresent = async (userId: string, jti: string): Promise<boolean> => {
  const exists = await redis.exists(refreshJtiKey(userId, jti))
  if (!exists) return false
  await redis.del(refreshJtiKey(userId, jti))
  return true
}

export const deleteRefreshJti = async (userId: string, jti: string): Promise<void> => {
  await redis.del(refreshJtiKey(userId, jti))
}
