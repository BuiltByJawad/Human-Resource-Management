import { recruitmentRepository } from './recruitment.repository';
import { NotFoundError } from '../../shared/utils/errors';
import { CreateJobDto, CreateApplicationDto, RecruitmentQueryDto } from './dto';
import { PAGINATION } from '../../shared/constants';

export class RecruitmentService {
    async getAllJobs() {
        return recruitmentRepository.findAllJobs();
    }

    async getJobById(id: string) {
        const job = await recruitmentRepository.findJobById(id);
        if (!job) throw new NotFoundError('Job not found');
        return job;
    }

    async createJob(data: CreateJobDto) {
        return recruitmentRepository.createJob({
            title: data.title,
            department: data.department,
            location: data.location,
            type: data.type || 'full-time',
            description: data.description,
            requirements: data.requirements || [],
            status: 'open',
        });
    }

    async getAllApplications(query: RecruitmentQueryDto) {
        const page = query.page || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.jobId) where.jobId = query.jobId;

        const [applications, total] = await Promise.all([
            recruitmentRepository.findAllApplications({ where, skip, take: limit }),
            recruitmentRepository.countApplications(where),
        ]);

        return { applications, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async createApplication(data: CreateApplicationDto) {
        return recruitmentRepository.createApplication({
            jobId: data.jobId,
            candidateName: data.candidateName,
            candidateEmail: data.candidateEmail,
            phone: data.phone,
            resume: data.resume,
            status: 'applied',
        });
    }
}

export const recruitmentService = new RecruitmentService();
