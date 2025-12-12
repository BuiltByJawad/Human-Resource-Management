import { leaveRepository } from './leave.repository';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { CreateLeaveRequestDto, UpdateLeaveRequestDto, LeaveQueryDto, ApproveLeaveDto, RejectLeaveDto } from './dto';
import { PAGINATION } from '../../shared/constants';

export class LeaveService {
    /**
     * Get all leave requests with pagination and filters
     */
    async getAll(query: LeaveQueryDto) {
        const page = query.page || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (query.status) {
            where.status = query.status;
        }

        if (query.employeeId) {
            where.employeeId = query.employeeId;
        }

        if (query.leaveType) {
            where.leaveType = query.leaveType;
        }

        if (query.startDate || query.endDate) {
            where.AND = [];

            if (query.startDate) {
                where.AND.push({
                    endDate: {
                        gte: new Date(query.startDate),
                    },
                });
            }

            if (query.endDate) {
                where.AND.push({
                    startDate: {
                        lte: new Date(query.endDate),
                    },
                });
            }
        }

        const [leaveRequests, total] = await Promise.all([
            leaveRepository.findAll({ where, skip, take: limit }),
            leaveRepository.count(where),
        ]);

        return {
            leaveRequests,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get leave request by ID
     */
    async getById(id: string) {
        const leaveRequest = await leaveRepository.findById(id);

        if (!leaveRequest) {
            throw new NotFoundError('Leave request not found');
        }

        return leaveRequest;
    }

    /**
     * Create new leave request
     */
    async create(employeeId: string, data: CreateLeaveRequestDto) {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        // Validate dates
        if (startDate > endDate) {
            throw new BadRequestError('Start date must be before end date');
        }

        // Calculate days requested
        const daysRequested = this.calculateBusinessDays(startDate, endDate);

        // Check leave balance (simplified - would need proper leave balance tracking)
        // const balance = await this.getLeaveBalance(employeeId, data.leaveType);
        // if (balance.remainingDays < daysRequested) {
        //   throw new BadRequestError('Insufficient leave balance');
        // }

        // Create leave request
        const leaveRequest = await leaveRepository.create({
            leaveType: data.leaveType as any,
            startDate,
            endDate,
            reason: data.reason,
            daysRequested,
            status: 'pending',
            employee: {
                connect: { id: employeeId },
            },
        });

        // TODO: Send notification to manager

        return leaveRequest;
    }

    /**
     * Update leave request (only if pending)
     */
    async update(id: string, data: UpdateLeaveRequestDto) {
        const leaveRequest = await this.getById(id);

        if (leaveRequest.status !== 'pending') {
            throw new BadRequestError('Cannot update leave request that has been processed');
        }

        const updateData: any = {};

        if (data.leaveType) updateData.leaveType = data.leaveType;
        if (data.reason) updateData.reason = data.reason;
        if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact;

        if (data.startDate || data.endDate) {
            const startDate = data.startDate ? new Date(data.startDate) : leaveRequest.startDate;
            const endDate = data.endDate ? new Date(data.endDate) : leaveRequest.endDate;

            if (startDate > endDate) {
                throw new BadRequestError('Start date must be before end date');
            }

            if (data.startDate) updateData.startDate = startDate;
            if (data.endDate) updateData.endDate = endDate;

            updateData.daysRequested = this.calculateBusinessDays(startDate, endDate);
        }

        return leaveRepository.update(id, updateData);
    }

    /**
     * Approve leave request
     */
    async approve(id: string, approverId: string, data?: ApproveLeaveDto) {
        const leaveRequest = await this.getById(id);

        if (leaveRequest.status !== 'pending') {
            throw new BadRequestError('Leave request has already been processed');
        }

        const updated = await leaveRepository.update(id, {
            status: 'approved',
            approver: {
                connect: { id: approverId },
            },

        });

        // TODO: Send approval notification to employee
        // TODO: Update leave balance

        return updated;
    }

    /**
     * Reject leave request
     */
    async reject(id: string, approverId: string, data: RejectLeaveDto) {
        const leaveRequest = await this.getById(id);

        if (leaveRequest.status !== 'pending') {
            throw new BadRequestError('Leave request has already been processed');
        }

        const updated = await leaveRepository.update(id, {
            status: 'rejected',
            approver: {
                connect: { id: approverId },
            },

        });

        // TODO: Send rejection notification to employee

        return updated;
    }

    /**
     * Cancel leave request
     */
    async cancel(id: string, employeeId: string) {
        const leaveRequest = await this.getById(id);

        // Verify ownership
        if (leaveRequest.employeeId !== employeeId) {
            throw new BadRequestError('You can only cancel your own leave requests');
        }

        if ((leaveRequest.status as any) === 'cancelled') {
            throw new BadRequestError('Leave request is already cancelled');
        }

        if (leaveRequest.status === 'approved') {
            // Check if it's too late to cancel (e.g., leave already started)
            const now = new Date();
            if (leaveRequest.startDate < now) {
                throw new BadRequestError('Cannot cancel leave that has already started');
            }
        }

        return leaveRepository.update(id, {
            status: 'rejected' as any,
        });
    }

    /**
     * Calculate business days between two dates
     */
    private calculateBusinessDays(startDate: Date, endDate: Date): number {
        let count = 0;
        const current = new Date(startDate);

        while (current <= endDate) {
            const dayOfWeek = current.getDay();
            // Skip weekends (0 = Sunday, 6 = Saturday)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }

        return count;
    }

    /**
     * Get leave balance for employee (simplified)
     */
    async getLeaveBalance(employeeId: string, leaveType?: string) {
        // This would connect to a leave balance table
        // For now, return mock data
        return {
            annual: { total: 20, used: 5, remaining: 15 },
            sick: { total: 10, used: 2, remaining: 8 },
            casual: { total: 5, used: 1, remaining: 4 },
        };
    }
}

export const leaveService = new LeaveService();
