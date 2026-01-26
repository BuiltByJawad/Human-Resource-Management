import { leaveRepository } from './leave.repository';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { CreateLeaveRequestDto, UpdateLeaveRequestDto, LeaveQueryDto, ApproveLeaveDto, RejectLeaveDto } from './dto';
import { PAGINATION } from '../../shared/constants';
import { prisma } from '../../shared/config/database';
import { notificationService } from '../notification/notification.service';
import { LeaveType, Prisma } from '@prisma/client';
import {
    calculateBusinessDays,
    calculateLeaveBalances,
    getLeavePolicySettingsFromJson,
    LeavePolicySettings,
    LeaveUsageSummary,
} from './utils/leavePolicyCalculator';

export class LeaveService {
    private async getLeavePolicySettings(): Promise<LeavePolicySettings> {
        const settings = (await prisma.companySettings.findFirst({
            orderBy: { createdAt: 'desc' },
        })) as { leavePolicy?: Prisma.InputJsonValue | null } | null;
        return getLeavePolicySettingsFromJson(settings?.leavePolicy);
    }

    private async assertNoOverlappingLeave(params: {
        employeeId: string;
        startDate: Date;
        endDate: Date;
        excludeLeaveRequestId?: string;
    }): Promise<void> {
        const { employeeId, startDate, endDate, excludeLeaveRequestId } = params;

        const overlap = await prisma.leaveRequest.findFirst({
            where: {
                employeeId,
                status: { in: ['pending', 'approved'] },
                ...(excludeLeaveRequestId ? { id: { not: excludeLeaveRequestId } } : {}),
                AND: [
                    { startDate: { lte: endDate } },
                    { endDate: { gte: startDate } },
                ],
            },
            select: { id: true },
        });

        if (overlap) {
            throw new BadRequestError('Leave request overlaps with an existing request');
        }
    }

    private async isApproverAllowed(params: {
        employeeId: string;
        approverEmployeeId: string;
    }): Promise<boolean> {
        const { employeeId, approverEmployeeId } = params;

        const employee = await prisma.employee.findFirst({
            where: { id: employeeId },
            select: { managerId: true },
        });

        // Manager-first rule (if configured manager exists)
        if (employee?.managerId) {
            if (employee.managerId === approverEmployeeId) return true;
        }

        // Fallback: any employee whose linked user has leave approval permission
        const approver = await prisma.employee.findFirst({
            where: { id: approverEmployeeId },
            select: {
                id: true,
                user: {
                    select: {
                        status: true,
                        role: {
                            select: {
                                permissions: {
                                    select: {
                                        permission: {
                                            select: { resource: true, action: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!approver?.user || approver.user.status !== 'active') return false;

        const permissions = approver.user.role.permissions.map((rp) => `${rp.permission.resource}.${rp.permission.action}`);
        return permissions.includes('leave_requests.approve');
    }

    private async getLeaveUsage(employeeId: string, asOf: Date): Promise<LeaveUsageSummary> {
        const year = asOf.getFullYear();
        const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
        const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

        const prevYear = year - 1;
        const prevStart = new Date(Date.UTC(prevYear, 0, 1, 0, 0, 0));
        const prevEnd = new Date(Date.UTC(prevYear, 11, 31, 23, 59, 59));

        const [current, previous] = await Promise.all([
            prisma.leaveRequest.groupBy({
                by: ['leaveType'],
                where: {
                    employeeId,
                    status: 'approved',
                    startDate: { gte: startOfYear, lte: endOfYear },
                },
                _sum: { daysRequested: true },
            }),
            prisma.leaveRequest.groupBy({
                by: ['leaveType'],
                where: {
                    employeeId,
                    status: 'approved',
                    startDate: { gte: prevStart, lte: prevEnd },
                },
                _sum: { daysRequested: true },
            }),
        ]);

        const usedDaysByType: Partial<Record<LeaveType, number>> = {};
        current.forEach((row) => {
            const total = row._sum.daysRequested;
            usedDaysByType[row.leaveType] = typeof total === 'number' ? total : 0;
        });

        const usedDaysByTypePreviousYear: Partial<Record<LeaveType, number>> = {};
        previous.forEach((row) => {
            const total = row._sum.daysRequested;
            usedDaysByTypePreviousYear[row.leaveType] = typeof total === 'number' ? total : 0;
        });

        return {
            usedDaysByType,
            usedDaysByTypePreviousYear,
        };
    }

    private async resolveApproverUserIds(employeeId: string): Promise<string[]> {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId },
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

    private async resolveEmployeeUserId(employeeId: string): Promise<string | null> {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId },
            select: { userId: true },
        });
        return employee?.userId ?? null;
    }

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

        const settings = await this.getLeavePolicySettings();
        const holidays = settings.calendar?.holidays ? new Set(settings.calendar.holidays) : undefined;

        // Calculate days requested
        const daysRequested = calculateBusinessDays(startDate, endDate, holidays);

        await this.assertNoOverlappingLeave({
            employeeId,
            startDate,
            endDate,
        });

        const leaveType = (data.leaveType as LeaveType | string) as LeaveType;
        if (leaveType !== LeaveType.unpaid) {
            const employeeForProration = await prisma.employee.findFirst({
                where: { id: employeeId },
                select: { hireDate: true },
            });
            const [usage] = await Promise.all([
                this.getLeaveUsage(employeeId, startDate),
            ]);
            const balances = calculateLeaveBalances({
                asOf: startDate,
                settings,
                usage,
                hireDate: employeeForProration?.hireDate ?? null,
            });
            const balance = balances[leaveType];
            if (balance && balance.remaining < daysRequested) {
                throw new BadRequestError('Insufficient leave balance');
            }
        }

        // Check leave balance (simplified - would need proper leave balance tracking)
        // const balance = await this.getLeaveBalance(employeeId, data.leaveType);
        // if (balance.remainingDays < daysRequested) {
        //   throw new BadRequestError('Insufficient leave balance');
        // }

        const employee = await prisma.employee.findFirst({
            where: { id: employeeId },
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

        const approverUserIds = await this.resolveApproverUserIds(employeeId);
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

            const settings = await this.getLeavePolicySettings();
            const holidays = settings.calendar?.holidays ? new Set(settings.calendar.holidays) : undefined;
            updateData.daysRequested = calculateBusinessDays(startDate, endDate, holidays);

            await this.assertNoOverlappingLeave({
                employeeId: leaveRequest.employeeId,
                startDate,
                endDate,
                excludeLeaveRequestId: leaveRequest.id,
            });

            const nextLeaveType = ((data.leaveType ?? leaveRequest.leaveType) as unknown) as LeaveType;
            if (nextLeaveType !== LeaveType.unpaid) {
                const employeeForProration = await prisma.employee.findFirst({
                    where: { id: leaveRequest.employeeId },
                    select: { hireDate: true },
                });
                const usage = await this.getLeaveUsage(leaveRequest.employeeId, startDate);
                const balances = calculateLeaveBalances({
                    asOf: startDate,
                    settings,
                    usage,
                    hireDate: employeeForProration?.hireDate ?? null,
                });
                const balance = balances[nextLeaveType];
                if (balance && balance.remaining < updateData.daysRequested) {
                    throw new BadRequestError('Insufficient leave balance');
                }
            }
        }

        const updated = await leaveRepository.update(id, updateData);
        if (!updated) {
            throw new NotFoundError('Leave request not found');
        }
        return updated;
    }

    /**
     * Approve leave request
     */
    async approve(id: string, approverId: string, data: ApproveLeaveDto | undefined) {
        const leaveRequest = await this.getById(id);

        if (leaveRequest.status !== 'pending') {
            throw new BadRequestError('Leave request has already been processed');
        }

        const isAllowed = await this.isApproverAllowed({
            employeeId: leaveRequest.employeeId,
            approverEmployeeId: approverId,
        });
        if (!isAllowed) {
            throw new BadRequestError('You are not allowed to approve this leave request');
        }

        const updated = await leaveRepository.update(id, {
            status: 'approved',
            approver: {
                connect: { id: approverId },
            },
        });

        if (!updated) {
            throw new NotFoundError('Leave request not found');
        }

        const employeeUserId = await this.resolveEmployeeUserId(updated.employeeId);
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
    async reject(id: string, approverId: string, data: RejectLeaveDto) {
        const leaveRequest = await this.getById(id);

        if (leaveRequest.status !== 'pending') {
            throw new BadRequestError('Leave request has already been processed');
        }

        const isAllowed = await this.isApproverAllowed({
            employeeId: leaveRequest.employeeId,
            approverEmployeeId: approverId,
        });
        if (!isAllowed) {
            throw new BadRequestError('You are not allowed to reject this leave request');
        }

        const updated = await leaveRepository.update(id, {
            status: 'rejected',
            approver: {
                connect: { id: approverId },
            },
        });

        if (!updated) {
            throw new NotFoundError('Leave request not found');
        }

        const employeeUserId = await this.resolveEmployeeUserId(updated.employeeId);

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

        const cancelled = await leaveRepository.update(id, {
            status: 'cancelled' as any,
        });

        if (!cancelled) {
            throw new NotFoundError('Leave request not found');
        }
        return cancelled;
    }

    /**
     * Get leave balance for employee (simplified)
     */
    async getLeaveBalance(employeeId: string, leaveType?: string) {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId },
            select: { id: true, hireDate: true },
        });
        if (!employee) {
            throw new NotFoundError('Employee not found');
        }

        const asOf = new Date();
        const settings = await this.getLeavePolicySettings();
        const usage = await this.getLeaveUsage(employeeId, asOf);
        const balances = calculateLeaveBalances({
            asOf,
            settings,
            usage,
            hireDate: employee.hireDate,
        });

        if (leaveType) {
            const key = leaveType as keyof typeof balances;
            return { [leaveType]: balances[key] };
        }

        return balances;
    }
}

export const leaveService = new LeaveService();
