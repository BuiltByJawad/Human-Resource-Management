import { test, expect } from '@playwright/test';

test.describe('Health Checks', () => {
    test('should return healthy status', async ({ request }) => {
        const response = await request.get('/health');

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.status).toBe('healthy');
    });

    test('should have metrics endpoint', async ({ request }) => {
        const response = await request.get('/metrics');

        expect(response.ok()).toBeTruthy();
        const text = await response.text();
        expect(text).toContain('http_requests_total');
    });

    test('should have API documentation', async ({ request }) => {
        const response = await request.get('/api-docs');

        expect(response.ok()).toBeTruthy();
    });
});
