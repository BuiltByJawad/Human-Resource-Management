
import request from 'supertest';
import app from '../../src/index';

describe('Documents Module E2E', () => {
    let adminToken: string;
    let employeeToken: string;
    let docId: string;

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

        // Authenticate as Employee (if needed for read-only test, or just reuse admin)
        // Reusing admin for simplicity or could login as regular employee
    });

    test('1. Upload Document', async () => {
        const res = await request(app)
            .post('/api/documents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Company Handbook 2025',
                description: 'Updated policies',
                category: 'Handbook',
                fileUrl: 'https://s3.bucket/handbook.pdf',
                type: 'PDF'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBeDefined();
        docId = res.body.data.id;
    });

    test('2. List Documents', async () => {
        const res = await request(app)
            .get('/api/documents')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.some((d: any) => d.id === docId)).toBe(true);
    });

    test('3. Update Document', async () => {
        if (!docId) return;

        const res = await request(app)
            .patch(`/api/documents/${docId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                description: 'Revised 2025 policies'
            });

        expect(res.status).toBe(200);
        expect(res.body.data.description).toBe('Revised 2025 policies');
    });

    test('4. Delete Document', async () => {
        if (!docId) return;

        const res = await request(app)
            .delete(`/api/documents/${docId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
    });
});
