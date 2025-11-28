import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import { securityMiddleware, rateLimiter, requestLogger } from './middleware/security'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { connectDatabases } from './config/database'
import authRoutes from './routes/authRoutes'
import employeeRoutes from './routes/employeeRoutes'
import departmentRoutes from './routes/departmentRoutes'
import roleRoutes from './routes/roleRoutes'
import leaveRoutes from './routes/leaveRoutes'
import attendanceRoutes from './routes/attendanceRoutes'
import reportRoutes from './routes/reportRoutes'
import complianceRoutes from './routes/complianceRoutes'
import recruitmentRoutes from './routes/recruitmentRoutes'
import payrollRoutes from './routes/payrollRoutes'
import assetRoutes from './routes/assetRoutes'
import performanceRoutes from './routes/performance.routes'
import analyticsRoutes from './routes/analytics.routes'
import orgRoutes from './routes/orgRoutes'

config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve uploaded files (e.g. branding logo/favicon)
app.use('/uploads', express.static('uploads'))

app.use(requestLogger)
app.use(rateLimiter)
app.use(securityMiddleware)

app.use('/api/auth', authRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/leave', leaveRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/compliance', complianceRoutes)
app.use('/api/recruitment', recruitmentRoutes)
app.use('/api/payroll', payrollRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/performance', performanceRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/org', orgRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.use(notFoundHandler)
app.use(errorHandler)

const startServer = async () => {
  try {
    await connectDatabases()

    app.listen(PORT, () => {
      console.log(`🚀 HRM Backend Server running on port ${PORT}`)
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully')
  process.exit(0)
})

startServer()

export default app