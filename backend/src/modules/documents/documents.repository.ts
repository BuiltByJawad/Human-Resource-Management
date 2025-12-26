
import { prisma } from '../../shared/config/database';
import { CompanyDocument } from '@prisma/client';

export class DocumentsRepository {
    async create(data: any, organizationId: string): Promise<CompanyDocument> {
        return prisma.companyDocument.create({
            data: {
                ...data,
                organizationId,
            },
        });
    }

    async findAll(where: any = {}, organizationId: string): Promise<CompanyDocument[]> {
        return prisma.companyDocument.findMany({
            where: {
                ...where,
                organizationId,
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findById(id: string, organizationId: string): Promise<CompanyDocument | null> {
        return prisma.companyDocument.findFirst({ where: { id, organizationId } });
    }

    async update(id: string, data: any, organizationId: string): Promise<CompanyDocument | null> {
        const result = await prisma.companyDocument.updateMany({
            where: { id, organizationId },
            data,
        });

        if (!result.count) {
            return null;
        }

        return prisma.companyDocument.findFirst({ where: { id, organizationId } });
    }

    async delete(id: string, organizationId: string): Promise<number> {
        const result = await prisma.companyDocument.deleteMany({ where: { id, organizationId } });
        return result.count;
    }
}

export const documentsRepository = new DocumentsRepository();
