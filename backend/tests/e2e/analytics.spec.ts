import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

let authToken: string;

test.beforeAll(async ({ request }) => {
    authToken = await loginUser(request, 'admin@novahr.com', 'password123');
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
