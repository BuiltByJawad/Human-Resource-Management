import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Automated Backup Verification Script
 * 
 * This script performs automated verification of database backups by:
 * 1. Creating a temporary test database
 * 2. Restoring the backup to the test database
 * 3. Running data integrity checks
 * 4. Generating a verification report
 * 5. Cleaning up the test database
 */

const TEST_DB_NAME = 'hrm_backup_test';
const BACKUP_DIR = path.join(__dirname, '../backups');
const REPORTS_DIR = path.join(__dirname, '../backup-reports');

interface VerificationResult {
    backupFile: string;
    timestamp: string;
    success: boolean;
    checks: {
        restoration: boolean;
        tableCount: number;
        recordCount: number;
        integrity: boolean;
    };
    errors: string[];
}

function log(message: string): void {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

function error(message: string): void {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
}

async function getLatestBackup(): Promise<string | null> {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('hrm_backup_') && f.endsWith('.sql.gz'))
            .sort()
            .reverse();

        return files.length > 0 ? path.join(BACKUP_DIR, files[0]) : null;
    } catch (err: any) {
        error(`Failed to find backup files: ${err.message}`);
        return null;
    }
}

async function createTestDatabase(): Promise<boolean> {
    try {
        log(`Creating test database: ${TEST_DB_NAME}`);

        const dbUrl = process.env.DATABASE_URL || '';
        const [, user, pass, host, port] = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/) || [];

        execSync(
            `PGPASSWORD=${pass} psql -h ${host} -p ${port} -U ${user} -d postgres -c "DROP DATABASE IF EXISTS ${TEST_DB_NAME};"`,
            { stdio: 'pipe' }
        );

        execSync(
            `PGPASSWORD=${pass} psql -h ${host} -p ${port} -U ${user} -d postgres -c "CREATE DATABASE ${TEST_DB_NAME};"`,
            { stdio: 'pipe' }
        );

        log('Test database created successfully');
        return true;
    } catch (err: any) {
        error(`Failed to create test database: ${err.message}`);
        return false;
    }
}

async function restoreBackup(backupFile: string): Promise<boolean> {
    try {
        log(`Restoring backup: ${backupFile}`);

        const dbUrl = process.env.DATABASE_URL || '';
        const [, user, pass, host, port] = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/) || [];

        execSync(
            `gunzip -c ${backupFile} | PGPASSWORD=${pass} psql -h ${host} -p ${port} -U ${user} -d ${TEST_DB_NAME}`,
            { stdio: 'pipe' }
        );

        log('Backup restored successfully');
        return true;
    } catch (err: any) {
        error(`Failed to restore backup: ${err.message}`);
        return false;
    }
}

async function verifyIntegrity(): Promise<{ success: boolean; tableCount: number; recordCount: number; errors: string[] }> {
    const errors: string[] = [];
    let tableCount = 0;
    let recordCount = 0;

    try {
        const testDbUrl = process.env.DATABASE_URL?.replace(/\/[^/]+$/, `/${TEST_DB_NAME}`) || '';
        const prisma = new PrismaClient({
            datasources: {
                db: {
                    url: testDbUrl,
                },
            },
        });

        try {
            // Count tables
            const tables = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
      `;
            tableCount = parseInt(tables[0].count);
            log(`Found ${tableCount} tables`);

            if (tableCount === 0) {
                errors.push('No tables found in restored database');
            }

            // Count total records across key tables
            try {
                const userCount = await prisma.user.count();
                const employeeCount = await prisma.employee.count();
                const departmentCount = await prisma.department.count();

                recordCount = userCount + employeeCount + departmentCount;
                log(`Record counts - Users: ${userCount}, Employees: ${employeeCount}, Departments: ${departmentCount}`);
            } catch (err: any) {
                errors.push(`Failed to count records: ${err.message}`);
            }

            // Verify key relationships
            try {
                const employeesWithDepts = await prisma.employee.findMany({
                    where: {
                        departmentId: { not: null },
                    },
                    include: {
                        department: true,
                    },
                    take: 10,
                });

                const orphanedEmployees = employeesWithDepts.filter(e => !e.department);
                if (orphanedEmployees.length > 0) {
                    errors.push(`Found ${orphanedEmployees.length} orphaned employee records`);
                }
            } catch (err: any) {
                errors.push(`Failed to verify relationships: ${err.message}`);
            }

        } finally {
            await prisma.$disconnect();
        }

        return {
            success: errors.length === 0,
            tableCount,
            recordCount,
            errors,
        };
    } catch (err: any) {
        errors.push(`Integrity check failed: ${err.message}`);
        return {
            success: false,
            tableCount,
            recordCount,
            errors,
        };
    }
}

async function cleanupTestDatabase(): Promise<void> {
    try {
        log(`Cleaning up test database: ${TEST_DB_NAME}`);

        const dbUrl = process.env.DATABASE_URL || '';
        const [, user, pass, host, port] = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/) || [];

        // Terminate connections
        execSync(
            `PGPASSWORD=${pass} psql -h ${host} -p ${port} -U ${user} -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${TEST_DB_NAME}';"`,
            { stdio: 'pipe' }
        );

        // Drop database
        execSync(
            `PGPASSWORD=${pass} psql -h ${host} -p ${port} -U ${user} -d postgres -c "DROP DATABASE IF EXISTS ${TEST_DB_NAME};"`,
            { stdio: 'pipe' }
        );

        log('Test database cleaned up successfully');
    } catch (err: any) {
        error(`Failed to cleanup test database: ${err.message}`);
    }
}

async function generateReport(result: VerificationResult): Promise<void> {
    try {
        // Ensure reports directory exists
        if (!fs.existsSync(REPORTS_DIR)) {
            fs.mkdirSync(REPORTS_DIR, { recursive: true });
        }

        const reportFile = path.join(REPORTS_DIR, `verification_${Date.now()}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(result, null, 2));

        log(`Verification report saved: ${reportFile}`);

        // Also create a summary report
        const summary = `
Backup Verification Report
==========================
Backup File: ${result.backupFile}
Timestamp: ${result.timestamp}
Overall Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}

Checks:
- Restoration: ${result.checks.restoration ? '✅' : '❌'}
- Tables Found: ${result.checks.tableCount}
- Records Found: ${result.checks.recordCount}
- Data Integrity: ${result.checks.integrity ? '✅' : '❌'}

${result.errors.length > 0 ? `Errors:\n${result.errors.map(e => `- ${e}`).join('\n')}` : 'No errors found'}
`;

        console.log(summary);

        const summaryFile = path.join(REPORTS_DIR, `summary_${Date.now()}.txt`);
        fs.writeFileSync(summaryFile, summary);
    } catch (err: any) {
        error(`Failed to generate report: ${err.message}`);
    }
}

async function main(): Promise<void> {
    log('========================================');
    log('Starting Backup Verification');
    log('========================================');

    const result: VerificationResult = {
        backupFile: '',
        timestamp: new Date().toISOString(),
        success: false,
        checks: {
            restoration: false,
            tableCount: 0,
            recordCount: 0,
            integrity: false,
        },
        errors: [],
    };

    try {
        // Get latest backup
        const backupFile = await getLatestBackup();
        if (!backupFile) {
            result.errors.push('No backup files found');
            await generateReport(result);
            process.exit(1);
        }

        result.backupFile = backupFile;
        log(`Verifying backup: ${backupFile}`);

        // Create test database
        if (!await createTestDatabase()) {
            result.errors.push('Failed to create test database');
            await generateReport(result);
            process.exit(1);
        }

        // Restore backup
        if (!await restoreBackup(backupFile)) {
            result.errors.push('Failed to restore backup');
            await generateReport(result);
            await cleanupTestDatabase();
            process.exit(1);
        }

        result.checks.restoration = true;

        // Verify integrity
        const integrityResult = await verifyIntegrity();
        result.checks.tableCount = integrityResult.tableCount;
        result.checks.recordCount = integrityResult.recordCount;
        result.checks.integrity = integrityResult.success;
        result.errors.push(...integrityResult.errors);

        result.success = integrityResult.success && result.checks.restoration;

    } catch (err: any) {
        result.errors.push(`Verification failed: ${err.message}`);
    } finally {
        // Cleanup
        await cleanupTestDatabase();

        // Generate report
        await generateReport(result);

        log('========================================');
        log(`Verification ${result.success ? 'PASSED' : 'FAILED'}`);
        log('========================================');

        process.exit(result.success ? 0 : 1);
    }
}

// Run verification
main().catch((err) => {
    error(`Unhandled error: ${err.message}`);
    process.exit(1);
});
