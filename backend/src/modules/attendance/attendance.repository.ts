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

    async findById(id: string, organizationId: string) {
        return prisma.attendance.findFirst({
            where: {
                id,
                employee: {
                    organizationId,
                },
            },
            include: { employee: true },
        });
    }

    async create(data: any) {
        return prisma.attendance.create({ data });
    }

    async update(id: string, organizationId: string, data: any) {
        const result = await prisma.attendance.updateMany({
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

        return prisma.attendance.findFirst({
            where: {
                id,
                employee: {
                    organizationId,
                },
            },
            include: { employee: true },
        });
    }

    async findTodayRecord(employeeId: string, organizationId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return prisma.attendance.findFirst({
            where: {
                employeeId,
                employee: {
                    organizationId,
                },
                checkIn: { gte: today, lt: tomorrow },
            },
        });
    }
}

export const attendanceRepository = new AttendanceRepository();
