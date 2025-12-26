import { leaveRepository } from './leave.repository';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { CreateLeaveRequestDto, UpdateLeaveRequestDto, LeaveQueryDto, ApproveLeaveDto, RejectLeaveDto } from './dto';
import { PAGINATION } from '../../shared/constants';
import { prisma } from '../../shared/config/database';
import { notificationService } from '../notification/notification.service';

export class LeaveService {
    private async resolveApproverUserIds(employeeId: string, organizationId: string): Promise<string[]> {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, organizationId },
            select: {
                managerId: true,
                manager: {
                    select: {
                        userId: true,
                    },
                },
            },
        });

        const managerUserId = employee?.manager?.userId ?? null;
        if (managerUserId) {
            return [managerUserId];
        }

        const approvers = await prisma.user.findMany({
            where: {
                organizationId,
                status: 'active',
                role: {
                    permissions: {
                        some: {
                            permission: {
                                resource: 'leave_requests',
                                action: 'approve',
                            },
                        },
                    },
                },
            },
            select: { id: true },
            take: 25,
        });

        return approvers.map((u) => u.id);
    }

    private async resolveEmployeeUserId(employeeId: string, organizationId: string): Promise<string | null> {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, organizationId },
            select: { userId: true },
        });
        return employee?.userId ?? null;
    }

    /**
     * Get all leave requests with pagination and filters
     */
    async getAll(query: LeaveQueryDto, organizationId: string) {
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
            leaveRepository.findAll({ where, skip, take: limit }, organizationId),
            leaveRepository.count(where, organizationId),
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
    async getById(id: string, organizationId: string) {
        const leaveRequest = await leaveRepository.findById(id, organizationId);

        if (!leaveRequest) {
            throw new NotFoundError('Leave request not found');
        }

        return leaveRequest;
    }

    /**
     * Create new leave request
     */
    async create(employeeId: string, data: CreateLeaveRequestDto, organizationId: string) {
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

        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, organizationId },
            select: { id: true },
        });
        if (!employee) {
            throw new NotFoundError('Employee not found');
        }

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

        const approverUserIds = await this.resolveApproverUserIds(employeeId, organizationId);
        const employeeName = `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`.trim();
        await Promise.all(
            approverUserIds.map((userId) =>
                notificationService.create({
                    userId,
                    title: 'Leave request submitted',
                    message: `${employeeName} submitted a ${leaveRequest.leaveType} leave request (${daysRequested} day(s)).`,
                    type: 'leave',
                    link: '/leave/requests',
                })
            )
        );

        return leaveRequest;
    }

    /**
     * Update leave request (only if pending)
     */
    async update(id: string, data: UpdateLeaveRequestDto, organizationId: string) {
        const leaveRequest = await this.getById(id, organizationId);

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

        const updated = await leaveRepository.update(id, updateData, organizationId);
        if (!updated) {
            throw new NotFoundError('Leave request not found');
        }
        return updated;
    }

    /**
     * Approve leave request
     */
    async approve(id: string, approverId: string, data: ApproveLeaveDto | undefined, organizationId: string) {
        const leaveRequest = await this.getById(id, organizationId);

        if (leaveRequest.status !== 'pending') {
            throw new BadRequestError('Leave request has already been processed');
        }

        const updated = await leaveRepository.update(id, {
            status: 'approved',
            approver: {
                connect: { id: approverId },
            },

        }, organizationId);

        if (!updated) {
            throw new NotFoundError('Leave request not found');
        }

        const employeeUserId = await this.resolveEmployeeUserId(updated.employeeId, organizationId);
        if (employeeUserId) {
            await notificationService.create({
                userId: employeeUserId,
                title: 'Leave request approved',
                message: `Your ${updated.leaveType} leave request has been approved.`,
                type: 'leave',
                link: '/leave',
            });
        }
        // TODO: Update leave balance

        return updated;
    }

    /**
     * Reject leave request
     */
    async reject(id: string, approverId: string, data: RejectLeaveDto, organizationId: string) {
        const leaveRequest = await this.getById(id, organizationId);

        if (leaveRequest.status !== 'pending') {
            throw new BadRequestError('Leave request has already been processed');
        }

        const updated = await leaveRepository.update(id, {
            status: 'rejected',
            approver: {
                connect: { id: approverId },
            },

        }, organizationId);

        if (!updated) {
            throw new NotFoundError('Leave request not found');
        }

        const employeeUserId = await this.resolveEmployeeUserId(updated.employeeId, organizationId);
        if (employeeUserId) {
            await notificationService.create({
                userId: employeeUserId,
                title: 'Leave request rejected',
                message: data?.reason ? `Your leave request was rejected: ${data.reason}` : 'Your leave request was rejected.',
                type: 'leave',
                link: '/leave',
            });
        }

        return updated;
    }

    /**
     * Cancel leave request
     */
    async cancel(id: string, employeeId: string, organizationId: string) {
        const leaveRequest = await this.getById(id, organizationId);

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

        const cancelled = await leaveRepository.update(id, {
            status: 'cancelled' as any,
        }, organizationId);

        if (!cancelled) {
            throw new NotFoundError('Leave request not found');
        }
        return cancelled;
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
    async getLeaveBalance(employeeId: string, organizationId: string, leaveType?: string) {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, organizationId },
            select: { id: true },
        });
        if (!employee) {
            throw new NotFoundError('Employee not found');
        }

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
