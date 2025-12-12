import { test, expect } from '@playwright/test';

let authToken: string;
let employeeId: string;

test.beforeAll(async ({ request }) => {
    // Register and login to get auth token
    const email = `admin${Date.now()}@example.com`;
    const registerRes = await request.post('/api/auth/register', {
        data: {
            email,
            password: 'Admin123!@#',
            firstName: 'Admin',
            lastName: 'User',
        },
    });
    const data = await registerRes.json();
    authToken = data.data.accessToken;
});

test.describe('Employee Management', () => {
    test('should create a new employee', async ({ request }) => {
        const response = await request.post('/api/employees', {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            data: {
                firstName: 'John',
                lastName: 'Doe',
                email: `john.doe${Date.now()}@company.com`,
                phone: '1234567890',
                hireDate: new Date().toISOString(),
                salary: 50000,
                status: 'active',
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.firstName).toBe('John');

        employeeId = data.data.id;
    });

    test('should get all employees', async ({ request }) => {
        const response = await request.get('/api/employees', {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });

    test('should search employees', async ({ request }) => {
        const response = await request.get('/api/employees?search=John', {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
    });

    test('should update employee', async ({ request }) => {
        // Create employee first
        const createRes = await request.post('/api/employees', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                firstName: 'Jane',
                lastName: 'Smith',
                email: `jane${Date.now()}@company.com`,
                hireDate: new Date().toISOString(),
                salary: 60000,
            },
        });
        const createData = await createRes.json();
        const id = createData.data.id;

        // Update
        const response = await request.put(`/api/employees/${id}`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                firstName: 'Jane',
                lastName: 'Updated',
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.lastName).toBe('Updated');
    });
});
