export interface UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: Date | string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}

export interface UploadDocumentDto {
    type: 'id' | 'contract' | 'certification' | 'personal' | 'tax' | 'other';
    name: string;
    url: string;
}

export interface EmergencyContactDto {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    isPrimary?: boolean;
}

export interface DirectoryQueryDto {
    search?: string;
    department?: string;
    page?: number;
    limit?: number;
}
