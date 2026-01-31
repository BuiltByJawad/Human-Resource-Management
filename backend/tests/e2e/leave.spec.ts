import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

let authToken: string;
let leaveRequestId: string;

test.beforeAll(async ({ request }) => {
    authToken = await loginUser(request, 'employee@novahr.com', 'password123');
});

test.describe('Leave Management', () => {
    test('should create leave request', async ({ request }) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 7);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 2);

        const response = await request.post('/api/leave', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                leaveType: 'unpaid',
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                reason: 'Family vacation',
            },
        });

        if (!response.ok()) {
            const error = await response.json();
            const message = typeof error?.error === 'string' ? error.error : error?.error?.message;
            expect(message?.toLowerCase()).toContain('overlaps');
            return;
        }

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
