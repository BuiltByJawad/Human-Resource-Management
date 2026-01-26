import { roleRepository } from './role.repository';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from './dto';
// Import prisma for helper methods
import { prisma } from '../../shared/config/database';

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

        if (data.permissionIds && !Array.isArray(data.permissionIds)) {
            throw new BadRequestError('permissionIds must be an array');
        }

        // Create role
        const role = await roleRepository.create({
            name: data.name,
            description: data.description,
        });

        await roleRepository.syncPermissions(role.id, Array.isArray(data.permissionIds) ? data.permissionIds : []);

        const created = await roleRepository.findById(role.id);
        if (!created) {
            throw new NotFoundError('Role not found');
        }
        return created;
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

        if (data.permissionIds && !Array.isArray(data.permissionIds)) {
            throw new BadRequestError('permissionIds must be an array');
        }

        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;

        const updated = await roleRepository.update(id, updateData);

        if (data.permissionIds) {
            await roleRepository.syncPermissions(id, data.permissionIds);
        }

        const full = await roleRepository.findById(updated.id);
        if (!full) {
            throw new NotFoundError('Role not found');
        }
        return full;
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

        if (!user) {
            throw new NotFoundError('User not found');
        }

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
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user || !user.role) {
            return false;
        }

        const perms = Array.isArray((user.role as any).permissions) ? (user.role as any).permissions : [];
        return perms.some((rp: any) => `${rp.permission?.resource}.${rp.permission?.action}` === permission);
    }

    /**
     * Get user permissions
     */
    async getUserPermissions(userId: string): Promise<string[]> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user || !user.role) {
            return [];
        }

        const perms = Array.isArray((user.role as any).permissions) ? (user.role as any).permissions : [];
        return perms
            .map((rp: any) => {
                const resource = rp.permission?.resource;
                const action = rp.permission?.action;
                return resource && action ? `${resource}.${action}` : null;
            })
            .filter((p: string | null): p is string => !!p);
    }
}

export const roleService = new RoleService();
