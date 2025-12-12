import { test, expect } from '@playwright/test';

let authToken: string;

test.beforeAll(async ({ request }) => {
    const email = `portal${Date.now()}@example.com`;
    const registerRes = await request.post('/api/auth/register', {
        data: {
            email,
            password: 'Portal123!@#',
            firstName: 'Portal',
            lastName: 'User',
        },
    });
    const data = await registerRes.json();
    authToken = data.data.accessToken;
});

test.describe('Employee Portal', () => {
    test('should get employee profile', async ({ request }) => {
        const response = await request.get('/api/portal/profile', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('firstName');
        expect(data.data).toHaveProperty('lastName');
    });

    test('should update profile', async ({ request }) => {
        const response = await request.put('/api/portal/profile', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                phone: '555-1234',
                address: '123 Main St',
                city: 'New York',
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('updated');
    });

    test('should get paystubs', async ({ request }) => {
        const response = await request.get('/api/portal/paystubs', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });

    test('should get time-off requests', async ({ request }) => {
        const response = await request.get('/api/portal/time-off', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });

    test('should get documents', async ({ request }) => {
        const response = await request.get('/api/portal/documents', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });

    test('should upload document', async ({ request }) => {
        const response = await request.post('/api/portal/documents', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                type: 'personal',
                name: 'Resume.pdf',
                url: 'https://example.com/resume.pdf',
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('id');
    });

    test('should manage emergency contacts', async ({ request }) => {
        // Add contact
        const addRes = await request.post('/api/portal/emergency-contacts', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                name: 'John Doe',
                relationship: 'Spouse',
                phone: '555-9999',
                email: 'john@example.com',
                isPrimary: true,
            },
        });

        expect(addRes.ok()).toBeTruthy();
        const addData = await addRes.json();
        expect(addData.success).toBe(true);
        const contactId = addData.data.id;

        // Get contacts
        const getRes = await request.get('/api/portal/emergency-contacts', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(getRes.ok()).toBeTruthy();
        const getData = await getRes.json();
        expect(Array.isArray(getData.data)).toBe(true);
        expect(getData.data.length).toBeGreaterThan(0);

        // Update contact
        const updateRes = await request.put(`/api/portal/emergency-contacts/${contactId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                phone: '555-8888',
            },
        });

        expect(updateRes.ok()).toBeTruthy();

        // Delete contact
        const deleteRes = await request.delete(`/api/portal/emergency-contacts/${contactId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(deleteRes.ok()).toBeTruthy();
    });

    test('should get company directory', async ({ request }) => {
        const response = await request.get('/api/portal/directory', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });

    test('should search directory', async ({ request }) => {
        const response = await request.get('/api/portal/directory?search=Portal', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
    });
});
