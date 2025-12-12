import promClient from 'prom-client';

// Create a Registry
export const register = new promClient.Registry();

// Add default metrics (CPU, memory, event loop, etc.)
promClient.collectDefaultMetrics({ register });

// Custom Metrics

/**
 * HTTP Request Duration
 */
export const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

/**
 * HTTP Request Total
 */
export const httpRequestTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});

/**
 * Active Users
 */
export const activeUsers = new promClient.Gauge({
    name: 'active_users_total',
    help: 'Number of currently active users',
});

/**
 * Database Query Duration
 */
export const dbQueryDuration = new promClient.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table', 'status'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

/**
 * Database Connection Pool
 */
export const dbConnectionsActive = new promClient.Gauge({
    name: 'db_connections_active',
    help: 'Number of active database connections',
});

/**
 * Redis Operations
 */
export const redisOperationDuration = new promClient.Histogram({
    name: 'redis_operation_duration_seconds',
    help: 'Duration of Redis operations in seconds',
    labelNames: ['operation', 'status'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
});

/**
 * Business Metrics
 */
export const userRegistrations = new promClient.Counter({
    name: 'user_registrations_total',
    help: 'Total number of user registrations',
});

export const loginAttempts = new promClient.Counter({
    name: 'login_attempts_total',
    help: 'Total number of login attempts',
    labelNames: ['status'], // 'success' or 'failed'
});

export const employeeCount = new promClient.Gauge({
    name: 'employees_total',
    help: 'Total number of employees in the system',
});

export const leaveRequests = new promClient.Counter({
    name: 'leave_requests_total',
    help: 'Total number of leave requests',
    labelNames: ['status'], // 'pending', 'approved', 'rejected'
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeUsers);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbConnectionsActive);
register.registerMetric(redisOperationDuration);
register.registerMetric(userRegistrations);
register.registerMetric(loginAttempts);
register.registerMetric(employeeCount);
register.registerMetric(leaveRequests);

/**
 * Middleware to track HTTP metrics
 */
export const metricsMiddleware = (req: any, res: any, next: any) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path || 'unknown';

        httpRequestDuration.observe(
            {
                method: req.method,
                route,
                status_code: res.statusCode,
            },
            duration
        );

        httpRequestTotal.inc({
            method: req.method,
            route,
            status_code: res.statusCode,
        });
    });

    next();
};

/**
 * Update business metrics (call this periodically or on events)
 */
export const updateBusinessMetrics = async (prisma: any) => {
    try {
        // Update employee count
        const employeeCountValue = await prisma.employee.count();
        employeeCount.set(employeeCountValue);

        // Update active users (users who logged in within last 24 hours)
        const activeUserCount = await prisma.user.count({
            where: {
                lastLogin: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            },
        });
        activeUsers.set(activeUserCount);
    } catch (error) {
        console.error('Error updating business metrics:', error);
    }
};
