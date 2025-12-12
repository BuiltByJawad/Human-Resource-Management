import { test, expect } from '@playwright/test';

let authToken: string;

test.beforeAll(async ({ request }) => {
    const email = `recruit${Date.now()}@example.com`;
    const registerRes = await request.post('/api/auth/register', {
        data: {
            email,
            password: 'Recruit123!@#',
            firstName: 'Recruiter',
            lastName: 'User',
        },
    });
    const data = await registerRes.json();
    authToken = data.data.accessToken;
});

test.describe('Recruitment & ATS', () => {
    test('should create job posting', async ({ request }) => {
        const response = await request.post('/api/recruitment/jobs', {
            headers: { Authorization: `Bearer ${authToken}` },
            data: {
                title: 'Senior Software Engineer',
                department: 'Engineering',
                location: 'Remote',
                type: 'full-time',
                description: 'Looking for experienced developer',
                requirements: ['5+ years experience', 'React', 'Node.js'],
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.title).toBe('Senior Software Engineer');
    });

    test('should get all jobs', async ({ request }) => {
        const response = await request.get('/api/recruitment/jobs');

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
                type: 'full-time',
            },
        });
        const jobData = await jobRes.json();
        const jobId = jobData.data.id;

        // Submit application (no auth needed - public endpoint)
        const response = await request.post('/api/recruitment/applications', {
            data: {
                jobId,
                candidateName: 'John Doe',
                candidateEmail: `candidate${Date.now()}@example.com`,
                phone: '1234567890',
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
    });

    test('should get all applications', async ({ request }) => {
        const response = await request.get('/api/recruitment/applications', {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
    });
});
