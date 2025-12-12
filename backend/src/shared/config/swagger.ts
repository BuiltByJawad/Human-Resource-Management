import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HRM System API Documentation',
            version: '1.0.0',
            description: `
        Complete API documentation for Enterprise Human Resource Management System.
        
        ## Features
        - Employee Management
        - Leave Management
        - Attendance Tracking with Geofencing
        - Payroll Processing
        - Performance Reviews
        - Recruitment/ATS
        - Asset Management
        - Compliance Tracking
        - Analytics & Reporting
        
        ## Authentication
        Most endpoints require JWT authentication. Include the token in the Authorization header:
        \`Authorization: Bearer <your_token>\`
      `,
            contact: {
                name: 'HRM Support',
                email: 'support@hrm.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Development server',
            },
            {
                url: 'https://api-staging.hrm.com/api',
                description: 'Staging server',
            },
            {
                url: 'https://api.hrm.com/api',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token',
                },
            },
            schemas: {
                // Common schemas
                Error: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'error',
                        },
                        message: {
                            type: 'string',
                            example: 'An error occurred',
                        },
                    },
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true,
                        },
                        message: {
                            type: 'string',
                            example: 'Operation successful',
                        },
                    },
                },
                PaginationMeta: {
                    type: 'object',
                    properties: {
                        page: {
                            type: 'integer',
                            example: 1,
                        },
                        limit: {
                            type: 'integer',
                            example: 20,
                        },
                        total: {
                            type: 'integer',
                            example: 100,
                        },
                        pages: {
                            type: 'integer',
                            example: 5,
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Employees', description: 'Employee management' },
            { name: 'Departments', description: 'Department management' },
            { name: 'Leave', description: 'Leave requests and approvals' },
            { name: 'Attendance', description: 'Attendance tracking' },
            { name: 'Payroll', description: 'Payroll processing' },
            { name: 'Performance', description: 'Performance reviews' },
            { name: 'Recruitment', description: 'Applicant tracking' },
            { name: 'Assets', description: 'Asset management' },
            { name: 'Compliance', description: 'Compliance tracking' },
            { name: 'Analytics', description: 'Reports and analytics' },
            { name: 'Organization', description: 'Organization settings' },
        ],
    },
    apis: [
        './src/modules/**/*.routes.ts',
        './src/modules/**/*.dto.ts',
        './src/routes.ts',
    ],
};

export const swaggerSpec = swaggerJsdoc(options);
