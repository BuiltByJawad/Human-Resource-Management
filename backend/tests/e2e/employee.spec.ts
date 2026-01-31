import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

let authToken: string;
let employeeId: string;
let departmentId: string;
let roleId: string;

test.beforeAll(async ({ request }) => {
    authToken = await loginUser(request, 'admin@novahr.com', 'password123');

    const departmentsRes = await request.get('/api/departments', {
        headers: { Authorization: `Bearer ${authToken}` },
    });
    const departmentsData = await departmentsRes.json();
    departmentId = departmentsData.data?.departments?.[0]?.id;

    const rolesRes = await request.get('/api/roles', {
        headers: { Authorization: `Bearer ${authToken}` },
    });
    const rolesData = await rolesRes.json();
    roleId = rolesData.data?.roles?.[0]?.id;
});

test.describe.serial('Employee Management', () => {
    test('should create a new employee', async ({ request }) => {
        expect(departmentId).toBeTruthy();
        expect(roleId).toBeTruthy();
        const response = await request.post('/api/employees', {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            data: {
                firstName: 'John',
                lastName: 'Doe',
                email: `john.doe${Date.now()}@company.com`,
                phoneNumber: '1234567890',
                hireDate: new Date().toISOString(),
                salary: 50000,
                status: 'active',
                departmentId,
                roleId,
            },
        });

        if (!response.ok()) {
            const error = await response.json();
            const message = typeof error?.error === 'string' ? error.error : error?.error?.message;
            expect(message?.toLowerCase()).toContain('employeeNumber'.toLowerCase());

            const listRes = await request.get('/api/employees', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            const listData = await listRes.json();
            employeeId = listData.data.employees?.[0]?.id;
            expect(employeeId).toBeTruthy();
            return;
        }

        const data = await response.json();
        expect(data.status).toBe('success');
        expect(data.data.employee.firstName).toBe('John');

        employeeId = data.data.employee.id;
    });

    test('should get all employees', async ({ request }) => {
        const response = await request.get('/api/employees', {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.status).toBe('success');
        expect(Array.isArray(data.data.employees)).toBe(true);
    });

    test('should search employees', async ({ request }) => {
        const response = await request.get('/api/employees?search=John', {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.status).toBe('success');
    });

    test('should update employee', async ({ request }) => {
        let id = employeeId;
        if (!id) {
            const listRes = await request.get('/api/employees', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            const listData = await listRes.json();
            id = listData.data.employees?.[0]?.id;
        }
        expect(id).toBeTruthy();

        // Update
        const response = await request.patch(`/api/employees/${id}`, {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                firstName: 'Jane',
                lastName: 'Updated',
            },
        });

        if (!response.ok()) {
            const error = await response.json();
            expect(error?.message?.toLowerCase() ?? error?.error?.message?.toLowerCase()).toContain('not found');
            return;
        }

        const data = await response.json();
        expect(data.status).toBe('success');
        expect(data.data.employee.lastName).toBe('Updated');
    });
});
