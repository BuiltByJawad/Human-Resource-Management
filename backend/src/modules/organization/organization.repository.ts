import { prisma } from '../../shared/config/database';
import { Prisma } from '@prisma/client';

export class OrganizationRepository {
    async findFirst() {
        return prisma.organization.findFirst();
    }

    async create(data: Prisma.OrganizationCreateInput) {
        return prisma.organization.create({ data });
    }

    async update(id: string, data: Prisma.OrganizationUpdateInput) {
        return prisma.organization.update({ where: { id }, data });
    }
}

export const organizationRepository = new OrganizationRepository();
