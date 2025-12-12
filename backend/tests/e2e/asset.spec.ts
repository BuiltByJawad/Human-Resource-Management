import { test, expect } from '@playwright/test';

let authToken: string;

test.beforeAll(async ({ request }) => {
    const email = `asset${Date.now()}@example.com`;
    const registerRes = await request.post('/api/auth/register', {
        data: {
            email,
            password: 'Asset123!@#',
            firstName: 'Asset',
            lastName: 'Manager',
        },
    });
    const data = await registerRes.json();
    authToken = data.data.accessToken;
});

test.describe('Asset Management', () => {
    test('should create asset', async ({ request }) => {
        const response = await request.post('/api/assets', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                name: 'MacBook Pro',
                assetType: 'laptop',
                serialNumber: `SN${Date.now()}`,
                purchaseDate: '2024-01-01',
                purchaseCost: 2499,
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.name).toBe('MacBook Pro');
    });

    test('should get all assets', async ({ request }) => {
        const response = await request.get('/api/assets', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });

    test('should filter assets by status', async ({ request }) => {
        const response = await request.get('/api/assets?status=available', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
    });

    test('should search assets', async ({ request }) => {
        const response = await request.get('/api/assets?search=MacBook', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
    });
});
