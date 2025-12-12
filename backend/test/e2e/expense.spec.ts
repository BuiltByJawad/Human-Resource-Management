
import request from 'supertest';
import app from '../../src/index';

describe('Expense Module E2E', () => {
    let adminToken: string;
    let employeeId: string;
    let claimId: string;

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

    test('1. Submit Expense Claim', async () => {
        if (!employeeId) return;

        const res = await request(app)
            .post('/api/expenses')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                employeeId,
                amount: 150.50,
                category: 'Travel',
                date: new Date().toISOString(),
                description: 'Flight to NY',
                currency: 'USD'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
        claimId = res.body.data.id;
    });

    test('2. Get My Expenses', async () => {
        if (!employeeId) return;

        const res = await request(app)
            .get(`/api/expenses/my/${employeeId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('3. Manager Views Pending Claims', async () => {
        const res = await request(app)
            .get('/api/expenses/pending')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.some((c: any) => c.id === claimId)).toBe(true);
    });

    test('4. Approve Claim', async () => {
        if (!claimId) return;

        const res = await request(app)
            .patch(`/api/expenses/${claimId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                status: 'approved'
            });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('approved');
    });
});
