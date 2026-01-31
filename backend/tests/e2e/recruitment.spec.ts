import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

let authToken: string;
let departmentId: string;

test.beforeAll(async ({ request }) => {
    authToken = await loginUser(request, 'admin@novahr.com', 'password123');

    const departmentsRes = await request.get('/api/departments', {
        headers: { Authorization: `Bearer ${authToken}` },
    });
    const departmentsData = await departmentsRes.json();
    departmentId = departmentsData.data?.departments?.[0]?.id;
});

test.describe('Recruitment & ATS', () => {
    test('should create job posting', async ({ request }) => {
        expect(departmentId).toBeTruthy();
        const response = await request.post('/api/recruitment/jobs', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                title: 'Senior Software Engineer',
                departmentId,
                description: 'Looking for experienced developer',
                requirements: '5+ years experience, React, Node.js',
                closingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.title).toBe('Senior Software Engineer');
    });

    test('should get all jobs', async ({ request }) => {
        const response = await request.get('/api/recruitment/jobs', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });

    test('should submit application (public)', async ({ request }) => {
        // First create a job
        const jobRes = await request.post('/api/recruitment/jobs', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                title: 'Developer',
                departmentId,
                description: 'Generalist developer',
                requirements: 'Generalist role',
            },
        });
        const jobData = await jobRes.json();
        const jobId = jobData.data.id;

        // Submit application (auth required)
        const response = await request.post('/api/recruitment/applicants', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                jobId,
                firstName: 'John',
                lastName: 'Doe',
                email: `candidate${Date.now()}@example.com`,
                phone: '1234567890',
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
    });

    test('should get all applications', async ({ request }) => {
        const response = await request.get('/api/recruitment/applicants', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });
});
