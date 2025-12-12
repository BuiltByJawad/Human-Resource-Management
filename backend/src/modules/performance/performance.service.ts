import { performanceRepository } from './performance.repository';
import { NotFoundError } from '../../shared/utils/errors';
import { CreateReviewDto, CreateCycleDto, PerformanceQueryDto } from './dto';
import { PAGINATION } from '../../shared/constants';

export class PerformanceService {
    async getAllReviews(query: PerformanceQueryDto) {
        const page = query.page || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.employeeId) where.employeeId = query.employeeId;
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

    async createReview(data: CreateReviewDto, reviewerId: string) {
        return performanceRepository.createReview({
            employeeId: data.employeeId,
            reviewerId,
            cycleId: data.cycleId,
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
