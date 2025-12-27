import api from '@/lib/axios';

export interface CompanyDocument {
    id: string;
    title: string;
    description?: string;
    category: string;
    fileUrl: string;
    type: string;
    isVisible: boolean;
    uploadedBy: string;
    organizationId?: string;
    createdAt: string;
    updatedAt: string;
}

export const companyDocumentService = {
    getDocuments: async () => {
        try {
            const response = await api.get<{ data: CompanyDocument[] }>('/documents/company');
            return Array.isArray(response.data?.data) ? response.data.data : [];
        } catch {
            return [];
        }
    },

    uploadDocument: async (
        file: File,
        data: { title: string; description?: string; category: string }
    ) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', data.title);
        formData.append('category', data.category);
        if (data.description) formData.append('description', data.description);

        const response = await api.post('/documents/company', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    deleteDocument: async (documentId: string) => {
        const response = await api.delete(`/documents/company/${documentId}`);
        return response.data;
    },

    toggleVisibility: async (documentId: string, isVisible: boolean) => {
        const response = await api.patch(`/documents/company/${documentId}`, { isVisible });
        return response.data;
    },
};
