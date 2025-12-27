import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors'
import { logger } from '../config/database'

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Prisma errors (avoid leaking internals; return actionable 4xx)
  if (error?.name === 'PrismaClientKnownRequestError') {
    const code = error?.code
    if (code === 'P2002') {
      const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : String(error?.meta?.target || 'field')
      return res.status(400).json({
        success: false,
        error: {
          message: `Duplicate value for unique field(s): ${target}`,
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        },
      })
    }
    if (code === 'P2003') {
      const field = String(error?.meta?.field_name || 'foreign key')
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid reference for ${field}`,
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        },
      })
    }
  }

  const { statusCode = 500, message, isOperational = false } = error as AppError
  
  if (!isOperational) {
    logger.error('Non-operational error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
    })
  }
  
  res.status(statusCode).json({
    success: false,
    error: {
      message: isOperational ? message : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  })
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
    },
  })
}

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}