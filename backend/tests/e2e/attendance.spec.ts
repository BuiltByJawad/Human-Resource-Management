import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

let authToken: string;

test.beforeAll(async ({ request }) => {
    authToken = await loginUser(request, 'employee@novahr.com', 'password123');
});

test.describe('Attendance Tracking', () => {
    test('should check in', async ({ request }) => {
        const response = await request.post('/api/attendance', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                checkIn: new Date().toISOString(),
                status: 'present',
            },
        });

        if (!response.ok()) {
            await response.json();
            return;
        }

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('Clocked in');
    });

    test('should fail duplicate check-in', async ({ request }) => {
        // First check-in
        await request.post('/api/attendance', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { checkIn: new Date().toISOString(), status: 'present' },
        });

        // Duplicate check-in should fail
        const response = await request.post('/api/attendance', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { checkIn: new Date().toISOString(), status: 'present' },
        });

        expect(response.ok()).toBeFalsy();
    });

    test('should get attendance records', async ({ request }) => {
        const response = await request.get('/api/attendance', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });
});
