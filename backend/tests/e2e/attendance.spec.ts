import { test, expect } from '@playwright/test';

let authToken: string;

test.beforeAll(async ({ request }) => {
    const email = `attendance${Date.now()}@example.com`;
    const registerRes = await request.post('/api/auth/register', {
        data: {
            email,
            password: 'Attendance123!@#',
            firstName: 'Attendance',
            lastName: 'User',
        },
    });
    const data = await registerRes.json();
    authToken = data.data.accessToken;
});

test.describe('Attendance Tracking', () => {
    test('should check in', async ({ request }) => {
        const response = await request.post('/api/attendance/check-in', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                latitude: 40.7128,
                longitude: -74.0060,
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('Checked in');
    });

    test('should fail duplicate check-in', async ({ request }) => {
        // First check-in
        await request.post('/api/attendance/check-in', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { latitude: 40.7128, longitude: -74.0060 },
        });

        // Duplicate check-in should fail
        const response = await request.post('/api/attendance/check-in', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { latitude: 40.7128, longitude: -74.0060 },
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
