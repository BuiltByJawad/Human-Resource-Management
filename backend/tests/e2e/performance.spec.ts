import { test, expect } from '@playwright/test';

let authToken: string;

test.beforeAll(async ({ request }) => {
    const email = `perf${Date.now()}@example.com`;
    const registerRes = await request.post('/api/auth/register', {
        data: {
            email,
            password: 'Performance123!@#',
            firstName: 'Performance',
            lastName: 'Manager',
        },
    });
    const data = await registerRes.json();
    authToken = data.data.accessToken;
});

test.describe('Performance Management', () => {
    test('should create review cycle', async ({ request }) => {
        const response = await request.post('/api/performance/cycles', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                title: 'Q1 2024 Reviews',
                startDate: '2024-01-01',
                endDate: '2024-03-31',
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.title).toBe('Q1 2024 Reviews');
    });

    test('should get all review cycles', async ({ request }) => {
        const response = await request.get('/api/performance/cycles', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });

    test('should get all reviews', async ({ request }) => {
        const response = await request.get('/api/performance/reviews', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
    });
});
