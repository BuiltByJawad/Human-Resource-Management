import { complianceRepository } from './compliance.repository';
import { NotFoundError } from '../../shared/utils/errors';
import { CreateComplianceDto, UpdateComplianceDto, ComplianceQueryDto } from './dto';
import { PAGINATION } from '../../shared/constants';

export class ComplianceService {
    async getAll(query: ComplianceQueryDto) {
        const page = query.page || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.category) where.category = query.category;
        if (query.priority) where.priority = query.priority;

        const [records, total] = await Promise.all([
            complianceRepository.findAll({ where, skip, take: limit }),
            complianceRepository.count(where),
        ]);

        return {
            records,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }

    async getById(id: string) {
        const record = await complianceRepository.findById(id);
        if (!record) throw new NotFoundError('Compliance record not found');
        return record;
    }

    async create(data: CreateComplianceDto) {
        const createData: any = {
            title: data.title,
            category: data.category,
            description: data.description,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            priority: data.priority || 'medium',
            status: 'pending',
        };

        if (data.assignedTo) {
            createData.assignedToEmployee = { connect: { id: data.assignedTo } };
        }

        return complianceRepository.create(createData);
    }

    async update(id: string, data: UpdateComplianceDto) {
        await this.getById(id);

        const updateData: any = {};
        if (data.title) updateData.title = data.title;
        if (data.category) updateData.category = data.category;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
        if (data.priority) updateData.priority = data.priority;
        if (data.status) updateData.status = data.status;

        if (data.assignedTo !== undefined) {
            updateData.assignedToEmployee = data.assignedTo
                ? { connect: { id: data.assignedTo } }
                : { disconnect: true };
        }

        return complianceRepository.update(id, updateData);
    }

    async delete(id: string) {
        await this.getById(id);
        await complianceRepository.delete(id);
    }
}

export const complianceService = new ComplianceService();
