import { prisma } from '../../shared/config/database';

export class PortalRepository {
    async getEmployeeProfile(userId: string) {
        return prisma.employee.findFirst({
            where: { userId },
            include: {
                department: { select: { name: true } },
                user: { select: { email: true, role: true } },
            },
        });
    }

    async updateProfile(employeeId: string, data: any) {
        const updated = await prisma.employee.updateMany({
            where: { id: employeeId },
            data,
        });

        if (!updated.count) {
            return null;
        }

        return prisma.employee.findFirst({
            where: { id: employeeId },
            include: {
                department: { select: { name: true } },
                user: { select: { email: true, role: true } },
            },
        });
    }

    async getPaystubs(employeeId: string) {
        return prisma.payrollRecord.findMany({
            where: { employeeId },
            orderBy: { payPeriod: 'desc' },
            take: 12,
        });
    }

    async getTimeOffRequests(employeeId: string) {
        return prisma.leaveRequest.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Stub methods for EmployeeDocument (use after regenerating Prisma client)
    async getDocuments(employeeId: string) {
        // Return empty array - model may need regeneration
        return [];
    }

    async uploadDocument(employeeId: string, data: any) {
        // Stub - return mock document
        return { id: 'stub', employeeId, ...data, uploadedAt: new Date() };
    }

    // Stub methods for EmergencyContact (use after regenerating Prisma client)
    async getEmergencyContacts(employeeId: string) {
        // Return empty array - model may need regeneration
        return [];
    }

    async addEmergencyContact(employeeId: string, data: any) {
        // Stub - return mock contact
        return { id: 'stub', employeeId, ...data };
    }

    async updateEmergencyContact(id: string, data: any) {
        // Stub - return mock contact
        return { id, ...data };
    }

    async deleteEmergencyContact(id: string) {
        // Stub - return mock
        return { id };
    }

    async getDirectory(params: { skip: number; take: number; where?: any }) {
        return prisma.employee.findMany({
            ...params,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                employeeNumber: true,
                department: { select: { name: true } },
            },
            where: {
                ...params.where,
                status: 'active' as any,
            },
            orderBy: { firstName: 'asc' },
        });
    }

    async countDirectory(where: any = {}) {
        return prisma.employee.count({
            where: { ...where, status: 'active' as any },
        });
    }
}

export const portalRepository = new PortalRepository();
