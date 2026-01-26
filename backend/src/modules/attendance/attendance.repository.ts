import { prisma } from '../../shared/config/database';

export class AttendanceRepository {
    async findAll(params: { skip: number; take: number; where?: any }) {
        return prisma.attendance.findMany({
            ...params,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
            },
            orderBy: { checkIn: 'desc' },
        });
    }

    async count(where?: any) {
        return prisma.attendance.count({ where });
    }

    async findById(id: string) {
        return prisma.attendance.findFirst({
            where: {
                id,
            },
            include: { employee: true },
        });
    }

    async create(data: any) {
        return prisma.attendance.create({ data });
    }

    async update(id: string, data: any) {
        const result = await prisma.attendance.updateMany({
            where: {
                id,
            },
            data,
        });

        if (!result.count) {
            return null;
        }

        return prisma.attendance.findFirst({
            where: {
                id,
            },
            include: { employee: true },
        });
    }

    async findTodayRecord(employeeId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return prisma.attendance.findFirst({
            where: {
                employeeId,
                checkIn: { gte: today, lt: tomorrow },
            },
        });
    }
}

export const attendanceRepository = new AttendanceRepository();
