import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import { connectDatabases } from './shared/config/database';
import { requestLogger, rateLimiter, securityMiddleware } from './shared/middleware/security';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler';

// Import modular routes
import { authRoutes } from './modules/auth';
import { employeeRoutes } from './modules/employee';
import { departmentRoutes } from './modules/department';
import { roleRoutes } from './modules/role';
import { leaveRoutes } from './modules/leave';
import { payrollRoutes } from './modules/payroll';
import { assetRoutes } from './modules/asset';
import { complianceRoutes } from './modules/compliance';
import { organizationRoutes } from './modules/organization';
import { performanceRoutes } from './modules/performance';
import { recruitmentRoutes } from './modules/recruitment';
import { analyticsRoutes } from './modules/analytics';
import { attendanceRoutes } from './modules/attendance';
import { portalRoutes } from './modules/portal';
import { onboardingRoutes } from './modules/onboarding';
import { offboardingRoutes } from './modules/offboarding';
import { benefitsRoutes } from './modules/benefits';
import { expenseRoutes } from './modules/expense';
import { timeTrackingRoutes } from './modules/time-tracking';
import { shiftRoutes } from './modules/shift';
import { documentsRoutes } from './modules/documents';
import { trainingRoutes } from './modules/training';
import { goalsRoutes } from './modules/goals';

// Import legacy routes (if any still exist)
import reportRoutes from './routes/reportRoutes';

config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

app.use(requestLogger);
app.use(rateLimiter);
app.use(securityMiddleware);

// API Routes - Modular architecture
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/offboarding', offboardingRoutes);
app.use('/api/benefits', benefitsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/time-tracking', timeTrackingRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/goals', goalsRoutes);

// Legacy routes
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: ' healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDatabases();

    app.listen(PORT, () => {
      console.log(`🚀 HRM Backend Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Only start server if not running in Vercel (Vercel handles serverless execution)
if (!process.env.VERCEL) {
  startServer();
}

export default app;