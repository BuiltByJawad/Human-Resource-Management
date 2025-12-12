import { organizationRepository } from './organization.repository';
import { NotFoundError } from '../../shared/utils/errors';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';

export class OrganizationService {
    async getSettings() {
        let org = await organizationRepository.findFirst();

        if (!org) {
            org = await organizationRepository.create({
                name: 'My Organization',
                settings: {},
            });
        }

        return org;
    }

    async updateSettings(data: UpdateOrganizationDto) {
        const org = await this.getSettings();

        return organizationRepository.update(org.id, {
            name: data.name,
            description: data.description,
            settings: data.settings,
        });
    }
}

export const organizationService = new OrganizationService();
