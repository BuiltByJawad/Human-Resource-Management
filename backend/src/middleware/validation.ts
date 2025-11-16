import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { ValidationError } from '../utils/errors'

export const validateRequest = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    })
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))
      
      return next(new ValidationError(JSON.stringify(errors)))
    }
    
    req.body = value
    next()
  }
}

export const validateQuery = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    })
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))
      
      return next(new ValidationError(JSON.stringify(errors)))
    }
    
    req.query = value
    next()
  }
}

export const validateParams = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    })
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }))
      
      return next(new ValidationError(JSON.stringify(errors)))
    }
    
    req.params = value
    next()
  }
}