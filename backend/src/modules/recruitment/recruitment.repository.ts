import { prisma } from '../../shared/config/database';

export class RecruitmentRepository {
    async findAllJobs() {
        return prisma.jobPosting.findMany({ orderBy: { createdAt: 'desc' } });
    }

    async findJobById(id: string) {
        return prisma.jobPosting.findUnique({ where: { id } });
    }

    async createJob(data: any) {
        return prisma.jobPosting.create({ data });
    }

    async updateJob(id: string, data: any) {
        return prisma.jobPosting.update({ where: { id }, data });
    }

    async deleteJob(id: string) {
        return prisma.jobPosting.delete({ where: { id } });
    }

    async countJobs(where?: any) {
        return prisma.jobPosting.count({ where });
    }

    // Stub methods for job applications (model not yet in schema)
    async findAllApplications(params: { skip: number; take: number; where?: any }) {
        // Return empty array - jobApplication model not in schema yet
        return [];
    }

    async countApplications(where?: any) {
        // Return 0 - jobApplication model not in schema yet
        return 0;
    }

    async createApplication(data: any) {
        // Stub - jobApplication model not in schema yet
        return { id: 'stub', ...data, createdAt: new Date() };
    }
}

export const recruitmentRepository = new RecruitmentRepository();
