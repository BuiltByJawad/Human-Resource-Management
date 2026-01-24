import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'

const headerName = 'x-request-id'

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const incoming = req.header(headerName)
  const requestId = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID()

  ;(req as Request & { requestId?: string }).requestId = requestId
  res.setHeader('X-Request-Id', requestId)

  next()
}
