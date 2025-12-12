import { roleRepository } from './role.repository';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from './dto';

export class RoleService {
    /**
     * Get all roles
     */
    async getAll() {
        return roleRepository.findAll();
    }

    /**
     * Get role by ID
     */
    async getById(id: string) {
        const role = await roleRepository.findById(id);

        if (!role) {
            throw new NotFoundError('Role not found');
        }

        return role;
    }

    /**
     * Create new role
     */
    async create(data: CreateRoleDto) {
        // Check if role name already exists
        const existingRole = await roleRepository.findByName(data.name);
        if (existingRole) {
            throw new BadRequestError('Role with this name already exists');
        }

        // Validate permissions format
        if (data.permissions && !Array.isArray(data.permissions)) {
            throw new BadRequestError('Permissions must be an array');
        }

        // Create role
        const role = await roleRepository.create({
            name: data.name,
            description: data.description,
        });

        return role;
    }

    /**
     * Update role
     */
    async update(id: string, data: UpdateRoleDto) {
        // Verify role exists
        await this.getById(id);

        // Check name uniqueness if changing
        if (data.name) {
            const existingRole = await roleRepository.findByName(data.name);
            if (existingRole && existingRole.id !== id) {
                throw new BadRequestError('Role with this name already exists');
            }
        }

        // Validate permissions if provided
        if (data.permissions && !Array.isArray(data.permissions)) {
            throw new BadRequestError('Permissions must be an array');
        }

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.permissions) updateData.permissions = data.permissions;

        return roleRepository.update(id, updateData);
    }

    /**
     * Delete role
     */
    async delete(id: string) {
        const role = await roleRepository.findById(id);

        if (!role) {
            throw new NotFoundError('Role not found');
        }

        // Check if role is assigned to any users
        if (role._count.users > 0) {
            throw new BadRequestError(
                `Cannot delete role. It is assigned to ${role._count.users} user(s). Please reassign them first.`
            );
        }

        await roleRepository.delete(id);
    }

    /**
     * Assign role to user
     */
    async assignToUser(data: AssignRoleDto) {
        // Verify role exists
        await this.getById(data.roleId);

        // Assign role
        const user = await roleRepository.assignToUser(data.userId, data.roleId);

        return user;
    }

    /**
     * Get users by role
     */
    async getUsersByRole(roleId: string) {
        // Verify role exists
        await this.getById(roleId);

        return roleRepository.getUsersByRole(roleId);
    }

    /**
     * Check if user has permission
     */
    async hasPermission(userId: string, permission: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });

        if (!user || !user.role) {
            return false;
        }

        return (user.role as any).permissions?.includes(permission) || false;
    }

    /**
     * Get user permissions
     */
    async getUserPermissions(userId: string): Promise<string[]> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });

        if (!user || !user.role) {
            return [];
        }

        return (user.role as any).permissions || [];
    }
}

export const roleService = new RoleService();

// Import prisma for helper methods
import { prisma } from '../../shared/config/database';
