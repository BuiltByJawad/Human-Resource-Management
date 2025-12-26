
import { prisma } from '../../shared/config/database';
import { Shift, ShiftSwapRequest } from '@prisma/client';

export class ShiftRepository {
    async createShift(data: any): Promise<Shift> {
        return prisma.shift.create({ data });
    }

    async getShifts(organizationId: string, startDate: Date, endDate: Date): Promise<Shift[]> {
        return prisma.shift.findMany({
            where: {
                employee: {
                    organizationId,
                },
                startTime: { gte: startDate },
                endTime: { lte: endDate }
            },
            include: { employee: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { startTime: 'asc' }
        });
    }

    async getEmployeeShifts(organizationId: string, employeeId: string, startDate: Date, endDate: Date): Promise<Shift[]> {
        return prisma.shift.findMany({
            where: {
                employeeId,
                employee: {
                    organizationId,
                },
                startTime: { gte: startDate },
                endTime: { lte: endDate }
            },
            orderBy: { startTime: 'asc' }
        });
    }

    async getShiftById(organizationId: string, id: string): Promise<Shift | null> {
        return prisma.shift.findFirst({
            where: {
                id,
                employee: {
                    organizationId,
                },
            },
        });
    }

    async updateShift(organizationId: string, id: string, data: any): Promise<Shift | null> {
        const result = await prisma.shift.updateMany({
            where: {
                id,
                employee: {
                    organizationId,
                },
            },
            data,
        });

        if (!result.count) {
            return null;
        }

        return prisma.shift.findFirst({
            where: {
                id,
                employee: {
                    organizationId,
                },
            },
        });
    }

    async createSwapRequest(data: any): Promise<ShiftSwapRequest> {
        return prisma.shiftSwapRequest.create({ data });
    }

    async getSwapRequests(organizationId: string, status?: string): Promise<ShiftSwapRequest[]> {
        return prisma.shiftSwapRequest.findMany({
            where: {
                ...(status ? { status } : {}),
                shift: { employee: { organizationId } },
            },
            include: {
                shift: true,
                requestor: { select: { id: true, firstName: true, lastName: true } },
                target: { select: { id: true, firstName: true, lastName: true } }
            }
        });
    }

    async getSwapRequestById(organizationId: string, id: string): Promise<ShiftSwapRequest | null> {
        return prisma.shiftSwapRequest.findFirst({
            where: {
                id,
                shift: { employee: { organizationId } },
            },
            include: { shift: true }
        });
    }

    async updateSwapRequest(organizationId: string, id: string, data: any): Promise<ShiftSwapRequest | null> {
        const result = await prisma.shiftSwapRequest.updateMany({
            where: {
                id,
                shift: { employee: { organizationId } },
            },
            data,
        });

        if (!result.count) {
            return null;
        }

        return prisma.shiftSwapRequest.findFirst({
            where: {
                id,
                shift: { employee: { organizationId } },
            },
            include: { shift: true },
        });
    }
}

export const shiftRepository = new ShiftRepository();
