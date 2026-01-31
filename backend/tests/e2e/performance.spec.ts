import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

let authToken: string;

test.beforeAll(async ({ request }) => {
    authToken = await loginUser(request, 'hr@novahr.com', 'password123');
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
