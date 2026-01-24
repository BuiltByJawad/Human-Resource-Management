import { Request, Response, NextFunction } from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500, // Higher limit in dev
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // 5 in prod, 100 in dev for testing
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
})

export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 50 : 200,
  message: 'Too many admin requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

export const gdprRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 100,
  message: 'Too many GDPR requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const requestId = (req as Request & { requestId?: string }).requestId
    const requestLabel = requestId ? ` requestId=${requestId}` : ''
    console.log(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms${requestLabel}`)
  })

  next()
}

export const enforceHttps = (req: Request, res: Response, next: NextFunction) => {
  const isProduction = process.env.NODE_ENV === 'production'
  if (!isProduction) {
    return next()
  }

  const forwardedProto = req.headers['x-forwarded-proto']
  const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto
  if (protocol === 'https') {
    return next()
  }

  return res.status(403).json({
    status: 'error',
    message: 'HTTPS required',
  })
}

export const adminIpAllowlist = (req: Request, res: Response, next: NextFunction) => {
  const allowlist = (process.env.ADMIN_IP_ALLOWLIST || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (allowlist.length === 0) {
    return next()
  }

  const forwardedFor = req.headers['x-forwarded-for']
  const ipCandidate =
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim() || req.ip

  if (!ipCandidate || !allowlist.includes(ipCandidate)) {
    return res.status(403).json({ status: 'error', message: 'IP not allowed' })
  }

  return next()
}

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
  compression(),
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
  enforceHttps,
]