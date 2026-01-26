import { portalRepository } from './portal.repository';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { UpdateProfileDto, UploadDocumentDto, EmergencyContactDto, DirectoryQueryDto } from './dto';
import { PAGINATION } from '../../shared/constants';

export class PortalService {
    async getProfile(userId: string) {
        const employee = await portalRepository.getEmployeeProfile(userId);

        if (!employee) {
            throw new NotFoundError('Employee profile not found');
        }

        return employee;
    }

    async updateProfile(userId: string, data: UpdateProfileDto) {
        const employee = await this.getProfile(userId);

        const updateData: any = {};
        if (data.firstName) updateData.firstName = data.firstName;
        if (data.lastName) updateData.lastName = data.lastName;
        if (data.phone) updateData.phoneNumber = data.phone;
        if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);
        if (data.address) updateData.address = data.address;
        if (data.city) updateData.city = data.city;
        if (data.state) updateData.state = data.state;
        if (data.zipCode) updateData.zipCode = data.zipCode;

        return portalRepository.updateProfile(employee.id, updateData);
    }

    async getPaystubs(userId: string) {
        const employee = await this.getProfile(userId);
        return portalRepository.getPaystubs(employee.id);
    }

    async getTimeOffRequests(userId: string) {
        const employee = await this.getProfile(userId);
        return portalRepository.getTimeOffRequests(employee.id);
    }

    async getDocuments(userId: string) {
        const employee = await this.getProfile(userId);
        return portalRepository.getDocuments(employee.id);
    }

    async uploadDocument(userId: string, data: UploadDocumentDto) {
        const employee = await this.getProfile(userId);

        return portalRepository.uploadDocument(employee.id, {
            type: data.type,
            name: data.name,
            url: data.url,
        });
    }

    async getEmergencyContacts(userId: string) {
        const employee = await this.getProfile(userId);
        return portalRepository.getEmergencyContacts(employee.id);
    }

    async addEmergencyContact(userId: string, data: EmergencyContactDto) {
        const employee = await this.getProfile(userId);

        // If this is primary, unset others
        if (data.isPrimary) {
            const existing = await portalRepository.getEmergencyContacts(employee.id) as any[];
            for (const contact of existing) {
                if (contact.isPrimary) {
                    await portalRepository.updateEmergencyContact(contact.id, { isPrimary: false });
                }
            }
        }

        return portalRepository.addEmergencyContact(employee.id, data);
    }

    async updateEmergencyContact(contactId: string, userId: string, data: Partial<EmergencyContactDto>) {
        const employee = await this.getProfile(userId);

        // Verify contact belongs to this employee
        const contacts = await portalRepository.getEmergencyContacts(employee.id) as any[];
        const contact = contacts.find((c: any) => c.id === contactId);

        if (!contact) {
            throw new NotFoundError('Emergency contact not found');
        }

        // If setting as primary, unset others
        if (data.isPrimary) {
            for (const c of contacts) {
                if (c.isPrimary && c.id !== contactId) {
                    await portalRepository.updateEmergencyContact(c.id, { isPrimary: false });
                }
            }
        }

        return portalRepository.updateEmergencyContact(contactId, data);
    }

    async deleteEmergencyContact(contactId: string, userId: string) {
        const employee = await this.getProfile(userId);

        // Verify contact belongs to this employee
        const contacts = await portalRepository.getEmergencyContacts(employee.id) as any[];
        const contact = contacts.find((c: any) => c.id === contactId);

        if (!contact) {
            throw new NotFoundError('Emergency contact not found');
        }

        await portalRepository.deleteEmergencyContact(contactId);
    }

    async getDirectory(query: DirectoryQueryDto) {
        const page = query.page || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        const where: any = {};

        if (query.search) {
            where.OR = [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        if (query.department) {
            where.departmentId = query.department;
        }

        const [employees, total] = await Promise.all([
            portalRepository.getDirectory({ where, skip, take: limit }),
            portalRepository.countDirectory(where),
        ]);

        return {
            employees,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }
}

export const portalService = new PortalService();
