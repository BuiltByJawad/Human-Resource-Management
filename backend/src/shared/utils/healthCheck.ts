import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import * as fs from 'fs';
import * as os from 'os';
import net from 'net';

const prisma = new PrismaClient();

export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    checks: {
        database: CheckResult;
        redis: CheckResult;
        disk: CheckResult;
        memory: CheckResult;
        external: CheckResult;
    };
}

export interface CheckResult {
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    responseTime?: number;
    details?: Record<string, string | number | boolean>;
}

// Cache for health check results (5 seconds TTL)
let cachedHealth: HealthStatus | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5000; // 5 seconds

/**
 * Check database connectivity
 */
export async function checkDatabase(): Promise<CheckResult> {
    const startTime = Date.now();

    try {
        // Simple query to check database connection
        await prisma.$queryRaw`SELECT 1`;

        const responseTime = Date.now() - startTime;

        return {
            status: 'pass',
            message: 'Database connection successful',
            responseTime,
            details: {
                type: 'postgresql',
                connected: true,
            },
        };
    } catch (error: any) {
        return {
            status: 'fail',
            message: `Database connection failed: ${error.message}`,
            responseTime: Date.now() - startTime,
        };
    }
}

const checkTcpConnection = (host: string, port: number, timeoutMs: number): Promise<number> =>
    new Promise((resolve, reject) => {
        const start = Date.now();
        const socket = net.createConnection({ host, port });

        const cleanup = () => {
            socket.removeAllListeners();
            socket.destroy();
        };

        socket.setTimeout(timeoutMs);

        socket.on('connect', () => {
            const elapsed = Date.now() - start;
            cleanup();
            resolve(elapsed);
        });

        socket.on('timeout', () => {
            cleanup();
            reject(new Error('Connection timeout'));
        });

        socket.on('error', (error) => {
            cleanup();
            reject(error);
        });
    });

export async function checkExternalDependencies(): Promise<CheckResult> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 0);

    if (!smtpHost || !smtpPort) {
        return {
            status: 'warn',
            message: 'SMTP not configured; skipping external dependency check',
        };
    }

    try {
        const responseTime = await checkTcpConnection(smtpHost, smtpPort, 2000);
        return {
            status: 'pass',
            message: 'SMTP connectivity check passed',
            responseTime,
            details: {
                host: smtpHost,
                port: smtpPort,
            },
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'SMTP connectivity check failed';
        return {
            status: 'fail',
            message: `SMTP connectivity failed: ${message}`,
        };
    }
}

/**
 * Check Redis connectivity
 */
export async function checkRedis(): Promise<CheckResult> {
    const startTime = Date.now();

    try {
        const redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });

        await redisClient.connect();
        const pong = await redisClient.ping();
        await redisClient.quit();

        const responseTime = Date.now() - startTime;

        return {
            status: pong === 'PONG' ? 'pass' : 'fail',
            message: 'Redis connection successful',
            responseTime,
            details: {
                connected: pong === 'PONG',
            },
        };
    } catch (error: any) {
        return {
            status: 'fail',
            message: `Redis connection failed: ${error.message}`,
            responseTime: Date.now() - startTime,
        };
    }
}

/**
 * Check disk space
 */
export async function checkDiskSpace(): Promise<CheckResult> {
    try {
        const uploadPath = process.env.UPLOAD_PATH || 'uploads/';
        let stats;

        try {
            stats = fs.statfsSync(uploadPath);
        } catch {
            // Fallback to current directory if upload path doesn't exist
            stats = fs.statfsSync('.');
        }

        const totalSpace = stats.blocks * stats.bsize;
        const freeSpace = stats.bfree * stats.bsize;
        const usedSpace = totalSpace - freeSpace;
        const usedPercentage = (usedSpace / totalSpace) * 100;

        let status: 'pass' | 'warn' | 'fail' = 'pass';
        let message = 'Disk space is healthy';

        if (usedPercentage > 90) {
            status = 'fail';
            message = 'Critical: Disk space is over 90% full';
        } else if (usedPercentage > 80) {
            status = 'warn';
            message = 'Warning: Disk space is over 80% full';
        }

        return {
            status,
            message,
            details: {
                totalGB: (totalSpace / (1024 ** 3)).toFixed(2),
                freeGB: (freeSpace / (1024 ** 3)).toFixed(2),
                usedPercentage: usedPercentage.toFixed(2),
            },
        };
    } catch (error: any) {
        return {
            status: 'warn',
            message: `Disk space check failed: ${error.message}`,
        };
    }
}

/**
 * Check memory usage
 */
export async function checkMemory(): Promise<CheckResult> {
    try {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const usedPercentage = (usedMemory / totalMemory) * 100;

        let status: 'pass' | 'warn' | 'fail' = 'pass';
        let message = 'Memory usage is healthy';

        if (usedPercentage > 90) {
            status = 'fail';
            message = 'Critical: Memory usage is over 90%';
        } else if (usedPercentage > 80) {
            status = 'warn';
            message = 'Warning: Memory usage is over 80%';
        }

        return {
            status,
            message,
            details: {
                totalGB: (totalMemory / (1024 ** 3)).toFixed(2),
                freeGB: (freeMemory / (1024 ** 3)).toFixed(2),
                usedPercentage: usedPercentage.toFixed(2),
                processMemoryMB: (process.memoryUsage().heapUsed / (1024 ** 2)).toFixed(2),
            },
        };
    } catch (error: any) {
        return {
            status: 'warn',
            message: `Memory check failed: ${error.message}`,
        };
    }
}

/**
 * Aggregate all health checks
 */
export async function aggregateHealth(): Promise<HealthStatus> {
    // Check cache first
    const now = Date.now();
    if (cachedHealth && (now - cacheTimestamp) < CACHE_TTL) {
        return cachedHealth;
    }

    // Run all health checks in parallel with timeout
    const timeout = 5000; // 5 second timeout per check

    const checks = await Promise.race([
        Promise.all([
            checkDatabase(),
            checkRedis(),
            checkDiskSpace(),
            checkMemory(),
            checkExternalDependencies(),
        ]),
        new Promise<CheckResult[]>((resolve) =>
            setTimeout(() => resolve([
                { status: 'fail', message: 'Health check timeout' },
                { status: 'fail', message: 'Health check timeout' },
                { status: 'fail', message: 'Health check timeout' },
                { status: 'fail', message: 'Health check timeout' },
                { status: 'fail', message: 'Health check timeout' },
            ]), timeout)
        ),
    ]);

    const [database, redis, disk, memory, external] = checks;

    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (database.status === 'fail' || redis.status === 'fail') {
        overallStatus = 'unhealthy';
    } else if (
        database.status === 'warn' ||
        redis.status === 'warn' ||
        disk.status === 'warn' ||
        disk.status === 'fail' ||
        memory.status === 'warn' ||
        memory.status === 'fail' ||
        external.status === 'warn' ||
        external.status === 'fail'
    ) {
        overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
            database,
            redis,
            disk,
            memory,
            external,
        },
    };

    // Update cache
    cachedHealth = healthStatus;
    cacheTimestamp = now;

    return healthStatus;
}

/**
 * Simple liveness check - just returns if the process is running
 */
export function checkLiveness(): { alive: boolean } {
    return { alive: true };
}

/**
 * Readiness check - checks if app can handle requests
 */
export async function checkReadiness(): Promise<{ ready: boolean; reason?: string }> {
    try {
        const dbCheck = await checkDatabase();
        const redisCheck = await checkRedis();

        if (dbCheck.status === 'fail') {
            return { ready: false, reason: 'Database unavailable' };
        }

        if (redisCheck.status === 'fail') {
            return { ready: false, reason: 'Redis unavailable' };
        }

        return { ready: true };
    } catch (error: any) {
        return { ready: false, reason: error.message };
    }
}
