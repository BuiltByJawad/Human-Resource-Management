import { test, expect } from '@playwright/test';

let authToken: string;

test.beforeAll(async ({ request }) => {
    const email = `analytics${Date.now()}@example.com`;
    const registerRes = await request.post('/api/auth/register', {
        data: {
            email,
            password: 'Analytics123!@#',
            firstName: 'Analytics',
            lastName: 'User',
        },
    });
    const data = await registerRes.json();
    authToken = data.data.accessToken;
});

test.describe('Analytics & Reporting', () => {
    test('should get dashboard metrics', async ({ request }) => {
        const response = await request.get('/api/analytics/dashboard', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('totalEmployees');
        expect(data.data).toHaveProperty('activeEmployees');
        expect(data.data).toHaveProperty('turnoverRate');
    });

    test('should get department statistics', async ({ request }) => {
        const response = await request.get('/api/analytics/departments', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });
});
