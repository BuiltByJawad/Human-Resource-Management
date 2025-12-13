
import api from '@/lib/axios';

export interface CompanyDocument {
    id: string;
    title: string;
    description?: string;
    category: string;
    fileUrl: string;
    type: string;
    uploadedBy: string;
    createdAt: string;
}

export const documentService = {
    getDocuments: async (category?: string) => {
        try {
            const query = category ? `?category=${category}` : '';
            const response = await api.get<{ data: CompanyDocument[] }>(`/documents${query}`);
            return Array.isArray(response.data?.data) ? response.data.data : [];
        } catch (error) {
            console.error('Failed to fetch documents:', error);
            return [];
        }
    },

    uploadDocument: async (data: any) => {
        const response = await api.post('/documents', data);
        return response.data;
    },

    deleteDocument: async (id: string) => {
        const response = await api.delete(`/documents/${id}`);
        return response.data;
    }
};
