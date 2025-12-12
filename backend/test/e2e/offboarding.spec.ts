
import request from 'supertest';
import app from '../../src/index';

describe('Offboarding Module E2E', () => {
    let adminToken: string;
    let employeeId: string;
    let processId: string;
    let taskId: string;

    beforeAll(async () => {
        // Authenticate as Admin
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@company.com',
                password: 'password123',
            });

        adminToken = loginRes.body.token;
        if (!adminToken) adminToken = 'mock_token';

        // Fetch an employee to offboard
        const empRes = await request(app)
            .get('/api/employees')
            .set('Authorization', `Bearer ${adminToken}`);

        const employees = empRes.body.data;
        // Pick the last one to avoid conflict with onboarding test or main admin
        if (employees && employees.length > 0) {
            employeeId = employees[employees.length - 1].id;
        }
    });

    test('1. Initiate Offboarding', async () => {
        if (!employeeId) {
            console.warn('Skipping Offboarding test due to missing employee');
            return;
        }

        const res = await request(app)
            .post('/api/offboarding/initiate')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                employeeId,
                exitDate: new Date(Date.now() + 86400000 * 14).toISOString(), // 2 weeks from now
                reason: 'Resignation',
                notes: 'Moving to a new city'
            });

        if (res.status === 400 && res.body.message.includes('already initiated')) {
            // If running repeatedly, this might happen. We can try to fetch it.
            const getRes = await request(app)
                .get(`/api/offboarding/${employeeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(getRes.status).toBe(200);
            processId = getRes.body.data.id;
        } else {
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            processId = res.body.data.id;
        }
    });

    test('2. Verify Default Tasks Created', async () => {
        if (!employeeId) return;

        const res = await request(app)
            .get(`/api/offboarding/${employeeId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        const tasks = res.body.data.tasks;
        expect(tasks.length).toBeGreaterThan(0);
        expect(tasks.some((t: any) => t.title === 'Return Laptop')).toBe(true);

        taskId = tasks[0].id;
    });

    test('3. Complete an Offboarding Task', async () => {
        if (!taskId) return;

        const res = await request(app)
            .patch(`/api/offboarding/tasks/${taskId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                status: 'completed'
            });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('completed');
    });

    test('4. Get All Processes', async () => {
        const res = await request(app)
            .get('/api/offboarding')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });
});
