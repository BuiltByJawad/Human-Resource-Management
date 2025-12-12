import { test, expect } from '@playwright/test';

let authToken: string;
let leaveRequestId: string;

test.beforeAll(async ({ request }) => {
    const email = `manager${Date.now()}@example.com`;
    const registerRes = await request.post('/api/auth/register', {
        data: {
            email,
            password: 'Manager123!@#',
            firstName: 'Manager',
            lastName: 'User',
        },
    });
    const data = await registerRes.json();
    authToken = data.data.accessToken;
});

test.describe('Leave Management', () => {
    test('should create leave request', async ({ request }) => {
        const response = await request.post('/api/leave', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                leaveType: 'annual',
                startDate: '2024-03-01',
                endDate: '2024-03-05',
                reason: 'Family vacation',
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.status).toBe('pending');

        leaveRequestId = data.data.id;
    });

    test('should get all leave requests', async ({ request }) => {
        const response = await request.get('/api/leave', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });

    test('should filter leave requests by status', async ({ request }) => {
        const response = await request.get('/api/leave?status=pending', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
    });
});
