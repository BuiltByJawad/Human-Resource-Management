import { test, expect } from '@playwright/test';
import { uniqueEmail } from './utils';

let authToken: string;

test.describe('Authentication Flow', () => {
    test('should register a new user', async ({ request }) => {
        const response = await request.post('/api/auth/register', {
            data: {
                email: uniqueEmail('auth'),
                password: 'Test123!@#',
                firstName: 'Test',
                lastName: 'User',
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.accessToken).toBeDefined();
    });

    test('should login with valid credentials', async ({ request }) => {
        // First, register a user
        const email = uniqueEmail('auth');
        await request.post('/api/auth/register', {
            data: {
                email,
                password: 'Test123!@#',
                firstName: 'Test',
                lastName: 'User',
            },
        });

        // Then login
        const response = await request.post('/api/auth/login', {
            data: {
                email,
                password: 'Test123!@#',
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.accessToken).toBeDefined();

        authToken = data.data.accessToken;
    });

    test('should fail login with invalid credentials', async ({ request }) => {
        const response = await request.post('/api/auth/login', {
            data: {
                email: 'invalid@example.com',
                password: 'wrongpassword',
            },
        });

        expect(response.ok()).toBeFalsy();
    });

    test('should get user profile with valid token', async ({ request }) => {
        // Register and login
        const email = uniqueEmail('auth');
        const registerRes = await request.post('/api/auth/register', {
            data: {
                email,
                password: 'Test123!@#',
                firstName: 'Test',
                lastName: 'User',
            },
        });
        const registerData = await registerRes.json();
        const token = registerData.data.accessToken;

        // Get profile
        const response = await request.get('/api/auth/profile', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.user.email).toBe(email);
    });
});
