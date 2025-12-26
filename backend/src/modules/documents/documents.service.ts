
import { documentsRepository } from './documents.repository';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import { NotFoundError } from '../../shared/utils/errors';

export class DocumentsService {
    async uploadDocument(data: CreateDocumentDto, uploadedBy: string, organizationId: string) {
        return documentsRepository.create({
            ...data,
            uploadedBy,
        }, organizationId);
    }

    async getDocuments(organizationId: string, category?: string) {
        const where: any = { isVisible: true };
        if (category) {
            where.category = category;
        }
        return documentsRepository.findAll(where, organizationId);
    }

    async getDocument(id: string, organizationId: string) {
        const doc = await documentsRepository.findById(id, organizationId);
        if (!doc) throw new NotFoundError('Document not found');
        return doc;
    }

    async updateDocument(id: string, data: UpdateDocumentDto, organizationId: string) {
        await this.getDocument(id, organizationId); // Ensure exists
        const updated = await documentsRepository.update(id, data, organizationId);
        if (!updated) throw new NotFoundError('Document not found');
        return updated;
    }

    async deleteDocument(id: string, organizationId: string) {
        await this.getDocument(id, organizationId); // Ensure exists
        await documentsRepository.delete(id, organizationId);
    }
}

export const documentsService = new DocumentsService();
