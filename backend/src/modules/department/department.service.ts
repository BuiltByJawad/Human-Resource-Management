import { departmentRepository } from './department.repository';
import { NotFoundError } from '../../shared/utils/errors';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto';

export class DepartmentService {
    async getAll() {
        return departmentRepository.findAll();
    }

    async getById(id: string) {
        const department = await departmentRepository.findById(id);

        if (!department) {
            throw new NotFoundError('Department not found');
        }

        return department;
    }

    async create(data: CreateDepartmentDto) {
        const department = await departmentRepository.create({
            name: data.name,
            description: data.description,
            manager: data.managerId ? { connect: { id: data.managerId } } : undefined,
        });

        return department;
    }

    async update(id: string, data: UpdateDepartmentDto) {
        await this.getById(id); // Verify exists

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.managerId) updateData.manager = { connect: { id: data.managerId } };

        return departmentRepository.update(id, updateData);
    }

    async delete(id: string) {
        await this.getById(id); // Verify exists
        await departmentRepository.delete(id);
    }
}

export const departmentService = new DepartmentService();
