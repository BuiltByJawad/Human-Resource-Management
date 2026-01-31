import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

let authToken: string;

test.beforeAll(async ({ request }) => {
    authToken = await loginUser(request, 'admin@novahr.com', 'password123');
});

test.describe('Asset Management', () => {
    test('should create asset', async ({ request }) => {
        const response = await request.post('/api/assets', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                name: 'MacBook Pro',
                type: 'laptop',
                serialNumber: `SN${Date.now()}`,
                purchaseDate: '2024-01-01',
                purchasePrice: 2499,
                vendor: 'Apple',
                status: 'available',
                assignedTo: null,
                assignedDate: null,
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
