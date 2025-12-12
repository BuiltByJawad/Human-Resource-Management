
import { prisma } from '../../shared/config/database';
import { CompanyDocument } from '@prisma/client';

export class DocumentsRepository {
    async create(data: any): Promise<CompanyDocument> {
        return prisma.companyDocument.create({ data });
    }

    async findAll(where: any = {}): Promise<CompanyDocument[]> {
        return prisma.companyDocument.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
    }

    async findById(id: string): Promise<CompanyDocument | null> {
        return prisma.companyDocument.findUnique({ where: { id } });
    }

    async update(id: string, data: any): Promise<CompanyDocument> {
        return prisma.companyDocument.update({
            where: { id },
            data
        });
    }

    async delete(id: string): Promise<CompanyDocument> {
        return prisma.companyDocument.delete({ where: { id } });
    }
}

export const documentsRepository = new DocumentsRepository();
