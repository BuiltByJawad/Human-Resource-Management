
import { prisma } from '../../shared/config/database';
import { CompanyDocument } from '@prisma/client';

export class DocumentsRepository {
    async create(data: any): Promise<CompanyDocument> {
        return prisma.companyDocument.create({
            data: {
                ...data,
            },
        });
    }

    async findAll(where: any = {}): Promise<CompanyDocument[]> {
        return prisma.companyDocument.findMany({
            where: {
                ...where,
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findById(id: string): Promise<CompanyDocument | null> {
        return prisma.companyDocument.findFirst({ where: { id } });
    }

    async update(id: string, data: any): Promise<CompanyDocument | null> {
        const result = await prisma.companyDocument.updateMany({
            where: { id },
            data,
        });

        if (!result.count) {
            return null;
        }

        return prisma.companyDocument.findFirst({ where: { id } });
    }

    async delete(id: string): Promise<number> {
        const result = await prisma.companyDocument.deleteMany({ where: { id } });
        return result.count;
    }
}

export const documentsRepository = new DocumentsRepository();
