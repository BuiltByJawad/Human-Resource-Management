
import { documentsRepository } from './documents.repository';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import { NotFoundError } from '../../shared/utils/errors';

export class DocumentsService {
    async uploadDocument(data: CreateDocumentDto, uploadedBy: string) {
        return documentsRepository.create({
            ...data,
            uploadedBy,
        });
    }

    async getDocuments(category?: string) {
        const where: any = { isVisible: true };
        if (category) {
            where.category = category;
        }
        return documentsRepository.findAll(where);
    }

    async getDocument(id: string) {
        const doc = await documentsRepository.findById(id);
        if (!doc) throw new NotFoundError('Document not found');
        return doc;
    }

    async updateDocument(id: string, data: UpdateDocumentDto) {
        await this.getDocument(id); // Ensure exists
        const updated = await documentsRepository.update(id, data);
        if (!updated) throw new NotFoundError('Document not found');
        return updated;
    }

    async deleteDocument(id: string) {
        await this.getDocument(id); // Ensure exists
        await documentsRepository.delete(id);
    }
}

export const documentsService = new DocumentsService();
