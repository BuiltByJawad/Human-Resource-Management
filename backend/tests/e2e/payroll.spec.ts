import { test, expect } from '@playwright/test';

let authToken: string;

test.beforeAll(async ({ request }) => {
    const email = `payroll${Date.now()}@example.com`;
    const registerRes = await request.post('/api/auth/register', {
        data: {
            email,
            password: 'Payroll123!@#',
            firstName: 'Payroll',
            lastName: 'Manager',
        },
    });
    const data = await registerRes.json();
    authToken = data.data.accessToken;
});

test.describe('Payroll Management', () => {
    test('should generate payroll for a period', async ({ request }) => {
        const response = await request.post('/api/payroll/generate', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                payPeriod: '2024-01',
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
    });

    test('should get all payroll records', async ({ request }) => {
        const response = await request.get('/api/payroll', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });

    test('should filter payroll by period', async ({ request }) => {
        const response = await request.get('/api/payroll?payPeriod=2024-01', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
    });

    test('should get payroll summary', async ({ request }) => {
        const response = await request.get('/api/payroll/summary/2024-01', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('totalEmployees');
        expect(data.data).toHaveProperty('totalNetSalary');
    });

    test('should update payroll status', async ({ request }) => {
        // Generate payroll first
        const genRes = await request.post('/api/payroll/generate', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: { payPeriod: '2024-02' },
        });
        const genData = await genRes.json();
        const payrollId = genData.data[0]?.id;

        if (payrollId) {
            const response = await request.put(`/api/payroll/${payrollId}/status`, {
                headers: { Authorization: `Bearer ${authToken}` },
                data: { status: 'approved' },
            });

            expect(response.ok()).toBeTruthy();
            const data = await response.json();
            expect(data.success).toBe(true);
        }
    });
});
