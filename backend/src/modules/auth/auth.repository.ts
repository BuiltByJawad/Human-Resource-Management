import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class AuthRepository {
    async findUserByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
                employee: true,
            },
        });
    }

    async findUserByEmailAndOrganization(email: string, organizationId: string) {
        return prisma.user.findFirst({
            where: { email, organizationId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
                employee: true,
            },
        });
    }

    async findUserById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            include: {
                role: true,
                employee: true,
            },
        });
    }

    async createUser(data: Prisma.UserCreateInput) {
        return prisma.user.create({
            data,
            include: {
                role: true,
            },
        });
    }

    async updateUser(id: string, data: Prisma.UserUpdateInput) {
        return prisma.user.update({
            where: { id },
            data,
        });
    }

    async updateUserPassword(id: string, hashedPassword: string) {
        return prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
    }

    async findRoleById(id: string) {
        return prisma.role.findUnique({
            where: { id },
        });
    }

    async findRoleByName(name: string) {
        return prisma.role.findUnique({
            where: { name },
        });
    }

    async findInvite(tokenHash: string) {
        return prisma.userInvite.findFirst({
            where: {
                tokenHash,
                acceptedAt: null,
                expiresAt: { gt: new Date() },
            },
            include: {
                user: true,
            },
        });
    }

    async createInvite(data: Prisma.UserInviteCreateInput) {
        return prisma.userInvite.create({
            data,
        });
    }

    async deleteInvitesByEmail(email: string) {
        return prisma.userInvite.deleteMany({
            where: { email, acceptedAt: null },
        });
    }

    async acceptInvite(id: string, userId: string) {
        return prisma.userInvite.update({
            where: { id },
            data: { acceptedAt: new Date(), userId },
        });
    }

    async createPasswordResetToken(data: Prisma.PasswordResetTokenCreateInput) {
        return prisma.passwordResetToken.create({
            data,
        });
    }

    async findPasswordResetToken(tokenHash: string) {
        return prisma.passwordResetToken.findFirst({
            where: {
                tokenHash,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
        });
    }

    async markTokenAsUsed(id: string) {
        return prisma.passwordResetToken.update({
            where: { id },
            data: { usedAt: new Date() },
        });
    }

    async findEmployeeByEmail(email: string) {
        return prisma.employee.findFirst({
            where: { email },
        });
    }

    async findEmployeeByEmailAndOrganization(email: string, organizationId: string) {
        return prisma.employee.findUnique({
            where: {
                organizationId_email: {
                    organizationId,
                    email,
                },
            },
        });
    }

    async updateEmployeeUserId(email: string, userId: string) {
        return prisma.employee.updateMany({
            where: { email },
            data: { userId },
        });
    }

    async updateEmployeeUserIdScoped(email: string, organizationId: string, userId: string) {
        return prisma.employee.updateMany({
            where: {
                organizationId,
                email,
            },
            data: { userId },
        });
    }

    async upsertEmployee(userId: string, data: any) {
        return prisma.employee.upsert({
            where: { userId },
            create: data,
            update: {
                firstName: data.firstName,
                lastName: data.lastName,
                phoneNumber: data.phoneNumber,
                address: data.address,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
                maritalStatus: data.maritalStatus,
                emergencyContact: data.emergencyContact,
            },
        });
    }
}

export const authRepository = new AuthRepository();
