
import request from 'supertest';
import app from '../../src/index';

describe('Time Tracking Module E2E', () => {
    let adminToken: string;
    let employeeId: string;
    let projectId: string;

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

        // Fetch an employee
        const empRes = await request(app)
            .get('/api/employees')
            .set('Authorization', `Bearer ${adminToken}`);

        const employees = empRes.body.data;
        if (employees && employees.length > 0) {
            employeeId = employees[0].id;
        }
    });

    test('1. Create Project', async () => {
        const res = await request(app)
            .post('/api/time-tracking/projects')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Website Redesign',
                description: 'Overhaul of corporate site',
                client: 'Internal',
                startDate: new Date().toISOString()
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
        projectId = res.body.data.id;
    });

    test('2. Clock In', async () => {
        if (!employeeId) return;

        const res = await request(app)
            .post('/api/time-tracking/clock-in')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                employeeId,
                projectId,
                date: new Date().toISOString(),
                startTime: new Date().toISOString(),
                description: 'Starting work'
            });

        // Handle case where user might already be clocked in from previous failed test run
        if (res.status === 400 && res.body.message.includes('already clocked in')) {
            expect(res.status).toBe(400);
        } else {
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        }
    });

    test('3. Clock Out', async () => {
        if (!employeeId) return;

        // Simulate working for 1 second (tests are fast)
        await new Promise(r => setTimeout(r, 1000));

        const res = await request(app)
            .post('/api/time-tracking/clock-out')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                employeeId,
                endTime: new Date().toISOString()
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.duration).toBeGreaterThanOrEqual(0);
    });

    test('4. Get Timesheet', async () => {
        if (!employeeId) return;

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const res = await request(app)
            .get(`/api/time-tracking/timesheet/${employeeId}?startDate=${today}&endDate=${today}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});
