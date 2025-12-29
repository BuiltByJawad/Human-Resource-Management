import { departmentRepository } from './department.repository';
import { NotFoundError, ConflictError } from '../../shared/utils/errors';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto';

export class DepartmentService {
    async getAll(organizationId: string) {
        return departmentRepository.findAll(organizationId);
    }

    async getById(id: string, organizationId: string) {
        const department = await departmentRepository.findById(id, organizationId);

        if (!department) {
            throw new NotFoundError('Department not found');
        }

        return department;
    }

    async create(data: CreateDepartmentDto, organizationId: string) {
        const existing = await departmentRepository.findByName(data.name, organizationId);
        if (existing) {
            throw new ConflictError('Department with this name already exists');
        }

        const department = await departmentRepository.create({
            name: data.name,
            description: data.description,
            manager: data.managerId ? { connect: { id: data.managerId } } : undefined,
            parentDepartment: data.parentDepartmentId
                ? { connect: { id: data.parentDepartmentId } }
                : undefined,
        }, organizationId);

        return department;
    }

    async update(id: string, data: UpdateDepartmentDto, organizationId: string) {
        const existing = await this.getById(id, organizationId); // Verify exists

        if (data.name && data.name !== existing.name) {
            const duplicate = await departmentRepository.findByName(data.name, organizationId);
            if (duplicate) {
                throw new ConflictError('Department with this name already exists');
            }
        }

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.managerId) updateData.manager = { connect: { id: data.managerId } };
        if (data.parentDepartmentId) {
            updateData.parentDepartment = { connect: { id: data.parentDepartmentId } };
        }

        const updated = await departmentRepository.update(id, updateData, organizationId);
        if (!updated) {
            throw new NotFoundError('Department not found');
        }
        return updated;
    }

    async delete(id: string, organizationId: string) {
        await this.getById(id, organizationId); // Verify exists
        await departmentRepository.delete(id, organizationId);
    }
}

export const departmentService = new DepartmentService();
