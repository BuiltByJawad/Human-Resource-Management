
import { prisma } from '../../shared/config/database';
import { Shift, ShiftSwapRequest } from '@prisma/client';

export class ShiftRepository {
    async createShift(data: any): Promise<Shift> {
        return prisma.shift.create({ data });
    }

    async getShifts(startDate: Date, endDate: Date): Promise<Shift[]> {
        return prisma.shift.findMany({
            where: {
                startTime: { gte: startDate },
                endTime: { lte: endDate }
            },
            include: { employee: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { startTime: 'asc' }
        });
    }

    async getEmployeeShifts(employeeId: string, startDate: Date, endDate: Date): Promise<Shift[]> {
        return prisma.shift.findMany({
            where: {
                employeeId,
                startTime: { gte: startDate },
                endTime: { lte: endDate }
            },
            orderBy: { startTime: 'asc' }
        });
    }

    async getShiftById(id: string): Promise<Shift | null> {
        return prisma.shift.findFirst({
            where: {
                id,
            },
        });
    }

    async updateShift(id: string, data: any): Promise<Shift | null> {
        const result = await prisma.shift.updateMany({
            where: {
                id,
            },
            data,
        });

        if (!result.count) {
            return null;
        }

        return prisma.shift.findFirst({
            where: {
                id,
            },
        });
    }

    async createSwapRequest(data: any): Promise<ShiftSwapRequest> {
        return prisma.shiftSwapRequest.create({ data });
    }

    async getSwapRequests(status?: string): Promise<ShiftSwapRequest[]> {
        return prisma.shiftSwapRequest.findMany({
            where: {
                ...(status ? { status } : {}),
            },
            include: {
                shift: true,
                requestor: { select: { id: true, firstName: true, lastName: true } },
                target: { select: { id: true, firstName: true, lastName: true } }
            }
        });
    }

    async getSwapRequestById(id: string): Promise<ShiftSwapRequest | null> {
        return prisma.shiftSwapRequest.findFirst({
            where: {
                id,
            },
            include: { shift: true }
        });
    }

    async updateSwapRequest(id: string, data: any): Promise<ShiftSwapRequest | null> {
        const result = await prisma.shiftSwapRequest.updateMany({
            where: {
                id,
            },
            data,
        });

        if (!result.count) {
            return null;
        }

        return prisma.shiftSwapRequest.findFirst({
            where: {
                id,
            },
            include: { shift: true },
        });
    }
}

export const shiftRepository = new ShiftRepository();
