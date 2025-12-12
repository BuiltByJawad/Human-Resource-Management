/**
 * Common HTTP status codes
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'You do not have permission to perform this action',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Validation failed',
    INTERNAL_ERROR: 'Internal server error',
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_EXISTS: 'Email already exists',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

/**
 * Date formats
 */
export const DATE_FORMATS = {
    ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
    DATE_ONLY: 'YYYY-MM-DD',
    DISPLAY: 'MMM DD, YYYY',
    DISPLAY_WITH_TIME: 'MMM DD, YYYY hh:mm A',
} as const;
