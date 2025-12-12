
import request from 'supertest';
import app from '../../src/index';

describe('Benefits Module E2E', () => {
    let adminToken: string;
    let employeeId: string;
    let planId: string;

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

        // Fetch an employee to enroll
        const empRes = await request(app)
            .get('/api/employees')
            .set('Authorization', `Bearer ${adminToken}`);

        const employees = empRes.body.data;
        if (employees && employees.length > 0) {
            employeeId = employees[0].id; // Use first employee
        }
    });

    test('1. Create Benefit Plan', async () => {
        const res = await request(app)
            .post('/api/benefits/plans')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Platinum Health Plus',
                type: 'Health',
                description: 'Premium health coverage',
                provider: 'BlueCross',
                costToEmployee: 150.00,
                costToCompany: 500.00
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
        planId = res.body.data.id;
    });

    test('2. Get Plans', async () => {
        const res = await request(app)
            .get('/api/benefits/plans')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('3. Enroll Employee in Plan', async () => {
        if (!employeeId || !planId) return;

        const res = await request(app)
            .post('/api/benefits/enroll')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                employeeId,
                benefitPlanId: planId,
                coverageStartDate: new Date().toISOString()
            });

        if (res.status === 400 && res.body.message.includes('already enrolled')) {
            // Pass if already enrolled ( idempotency for test runs)
            expect(res.status).toBe(400);
        } else {
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
        }
    });

    test('4. View Employee Benefits', async () => {
        if (!employeeId) return;

        const res = await request(app)
            .get(`/api/benefits/employee/${employeeId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.benefits).toBeDefined();
        expect(res.body.data.summary).toBeDefined();
    });
});
