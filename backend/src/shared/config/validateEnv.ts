import * as crypto from 'crypto';

/**
 * Environment Variable Validation
 * 
 * This module validates required environment variables on application startup
 * and ensures production secrets meet security requirements.
 */

interface EnvConfig {
    name: string;
    required: boolean;
    default?: string;
    validator?: (value: string) => boolean | string;
    description?: string;
}

const envSchema: EnvConfig[] = [
    // Application
    {
        name: 'NODE_ENV',
        required: true,
        validator: (val) => ['development', 'production', 'test'].includes(val) || 'Must be development, production, or test',
        description: 'Application environment',
    },
    {
        name: 'PORT',
        required: true,
        default: '5000',
        validator: (val) => {
            const port = parseInt(val);
            return (port > 0 && port < 65536) || 'Must be a valid port number';
        },
    },

    // Database
    {
        name: 'DATABASE_URL',
        required: true,
        validator: (val) => val.startsWith('postgresql://') || 'Must be a valid PostgreSQL connection string',
        description: 'PostgreSQL connection string',
    },
    {
        name: 'REDIS_URL',
        required: true,
        validator: (val) => val.startsWith('redis://') || 'Must be a valid Redis connection string',
        description: 'Redis connection string',
    },

    // JWT Secrets
    {
        name: 'JWT_SECRET',
        required: true,
        validator: (val) => {
            if (val.length < 32) {
                return 'JWT secret must be at least 32 characters';
            }
            if (process.env.NODE_ENV === 'production' && isWeakSecret(val)) {
                return 'JWT secret is too weak for production use. Generate a strong random secret.';
            }
            return true;
        },
        description: 'JWT access token secret',
    },
    {
        name: 'JWT_REFRESH_SECRET',
        required: true,
        validator: (val) => {
            if (val.length < 32) {
                return 'JWT refresh secret must be at least 32 characters';
            }
            if (process.env.NODE_ENV === 'production' && isWeakSecret(val)) {
                return 'JWT refresh secret is too weak for production use. Generate a strong random secret.';
            }
            return true;
        },
        description: 'JWT refresh token secret',
    },

    // Encryption
    {
        name: 'ENCRYPTION_KEY',
        required: false,
        validator: (val) => {
            if (val && val.length !== 64) {
                return 'Encryption key must be exactly 32 bytes (64 hex characters)';
            }
            return true;
        },
        description: 'Encryption key for sensitive data (32 bytes hex)',
    },

    // URLs
    {
        name: 'FRONTEND_URL',
        required: false,
        default: 'http://localhost:3000',
        validator: (val) => val.startsWith('http://') || val.startsWith('https://') || 'Must be a valid URL',
        description: 'Frontend application URL',
    },

    // Logging
    {
        name: 'LOG_LEVEL',
        required: false,
        default: 'info',
        validator: (val) => ['error', 'warn', 'info', 'debug'].includes(val) || 'Must be error, warn, info, or debug',
        description: 'Logging level',
    },
    {
        name: 'LOG_FILE_PATH',
        required: false,
        default: 'logs/',
        description: 'Path to log files',
    },
];

/**
 * Check if a secret is considered weak
 */
function isWeakSecret(secret: string): boolean {
    const weakSecrets = [
        'your-secret',
        'your-production-jwt-secret',
        'your-jwt-secret',
        'change-this',
        'changeme',
        'secret',
        'password',
        'test',
        'development',
        '123456',
    ];

    const lowerSecret = secret.toLowerCase();

    // Check against known weak passwords
    for (const weak of weakSecrets) {
        if (lowerSecret.includes(weak)) {
            return true;
        }
    }

    // Check if it's too simple (e.g., repeated characters)
    if (/ ^(.)\1+$/.test(secret)) {
        return true;
    }

    return false;
}

/**
 * Generate a strong random secret
 */
export function generateSecret(length: number = 64): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate all environment variables
 */
export function validateEnv(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const config of envSchema) {
        const value = process.env[config.name];

        // Check if required variable is present
        if (config.required && !value) {
            if (config.default) {
                process.env[config.name] = config.default;
                warnings.push(`${config.name} not set, using default: ${config.default}`);
            } else {
                errors.push(`Required environment variable ${config.name} is not set. ${config.description || ''}`);
            }
            continue;
        }

        // Set default if not present and not required
        if (!value && config.default) {
            process.env[config.name] = config.default;
            continue;
        }

        // Run validator if present
        if (value && config.validator) {
            const result = config.validator(value);
            if (result !== true) {
                if (config.required) {
                    errors.push(`${config.name}: ${result}`);
                } else {
                    warnings.push(`${config.name}: ${result}`);
                }
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Get environment summary (safe for logging)
 */
export function getEnvSummary(): Record<string, string> {
    const summary: Record<string, string> = {};

    for (const config of envSchema) {
        const value = process.env[config.name];

        if (!value) {
            summary[config.name] = '(not set)';
            continue;
        }

        // Mask sensitive values
        if (config.name.includes('SECRET') || config.name.includes('PASSWORD') || config.name.includes('KEY')) {
            summary[config.name] = `(${value.substring(0, 4)}...${value.substring(value.length - 4)})`;
        } else if (config.name.includes('URL') && value.includes('@')) {
            // Mask passwords in connection strings
            summary[config.name] = value.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
        } else {
            summary[config.name] = value;
        }
    }

    return summary;
}

/**
 * Print environment validation results
 */
export function printValidationResults(): void {
    const result = validateEnv();

    console.log('\n' + '='.repeat(60));
    console.log('Environment Variables Validation');
    console.log('='.repeat(60));

    if (result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach(error => console.log(`   - ${error}`));
        console.log('\n' + '='.repeat(60));
        console.log('');
        throw new Error('Environment validation failed. Please fix the errors above.');
    }

    console.log('\n✅ Environment validation passed');
    console.log('\nEnvironment Summary:');
    const summary = getEnvSummary();
    Object.entries(summary).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
    });
    console.log('='.repeat(60) + '\n');
}
