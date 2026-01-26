import { performanceRepository } from './performance.repository';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { CreateReviewDto, CreateCycleDto, PerformanceQueryDto } from './dto';
import { PAGINATION } from '../../shared/constants';

export class PerformanceService {
    async getAllReviews(query: PerformanceQueryDto) {
        const page = query.page || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        const where: any = {};
        const restrictReviewerId = (query as any).__restrictReviewerId;
        if (restrictReviewerId && query.employeeId) {
            where.OR = [
                { employeeId: query.employeeId },
                { reviewerId: restrictReviewerId },
            ];
        } else if (query.employeeId) {
            where.employeeId = query.employeeId;
        }
        if (query.cycleId) where.cycleId = query.cycleId;
        if (query.status) where.status = query.status;

        const [reviews, total] = await Promise.all([
            performanceRepository.findAllReviews({ where, skip, take: limit }),
            performanceRepository.countReviews(where),
        ]);

        return { reviews, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async getReviewById(id: string) {
        const review = await performanceRepository.findReviewById(id);
        if (!review) throw new NotFoundError('Review not found');
        return review;
    }

    async createReview(data: CreateReviewDto, reviewerEmployeeId: string) {
        const employee = await performanceRepository.findEmployeeById(data.employeeId);
        if (!employee) {
            throw new NotFoundError('Employee not found');
        }

        const reviewer = await performanceRepository.findEmployeeById(reviewerEmployeeId);
        if (!reviewer) {
            throw new NotFoundError('Reviewer not found');
        }

        const cycle = await performanceRepository.findCycleById(data.cycleId);
        if (!cycle) {
            throw new NotFoundError('Cycle not found');
        }

        if (data.type && !['self', 'peer', 'manager', '360'].includes(data.type)) {
            throw new BadRequestError('Invalid review type');
        }

        return performanceRepository.createReview({
            employeeId: employee.id,
            reviewerId: reviewer.id,
            cycleId: cycle.id,
            type: data.type || 'manager',
            ratings: data.ratings || {},
            comments: data.comments,
            status: 'submitted',
        });
    }

    async getCycles() {
        return performanceRepository.findAllCycles();
    }

    async createCycle(data: CreateCycleDto) {
        return performanceRepository.createCycle({
            title: data.title,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            status: 'active',
        });
    }
}

export const performanceService = new PerformanceService();
