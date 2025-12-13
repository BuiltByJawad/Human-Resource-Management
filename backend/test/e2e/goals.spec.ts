
import request from 'supertest';
import app from '../../src/index';

describe('Goals & OKRs Module E2E', () => {
    let adminToken: string;
    let goalId: string;
    let keyResultId: string;

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
    });

    test('1. Create Goal', async () => {
        const res = await request(app)
            .post('/api/goals')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Increase Annual Revenue',
                description: 'Company wide objective for 2025',
                startDate: new Date().toISOString(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
        goalId = res.body.data.id;
    });

    test('2. Add Key Result', async () => {
        if (!goalId) return;

        const res = await request(app)
            .post('/api/goals/key-results')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                goalId,
                description: 'Achieve $5M in sales',
                targetValue: 5000000,
                unit: 'currency'
            });

        expect(res.status).toBe(201);
        expect(res.body.data.id).toBeDefined();
        keyResultId = res.body.data.id;
    });

    test('3. View My Goals', async () => {
        const res = await request(app)
            .get('/api/goals/my-goals')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.some((g: any) => g.id === goalId)).toBe(true);
    });

    test('4. Update Key Result Progress', async () => {
        if (!keyResultId) return;

        const res = await request(app)
            .patch(`/api/goals/key-results/${keyResultId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                currentValue: 1000000
            });

        expect(res.status).toBe(200);
        expect(res.body.data.currentValue).toBe(1000000);
    });
});
