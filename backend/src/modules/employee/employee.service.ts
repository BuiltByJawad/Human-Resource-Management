import { employeeRepository } from './employee.repository';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQueryDto, EmployeeListResponse } from './dto';
import { PAGINATION } from '../../shared/constants';

export class EmployeeService {
    /**
     * Get paginated list of employees with filters
     */
    async getAll(query: EmployeeQueryDto, organizationId: string): Promise<EmployeeListResponse> {
        const page = query.page || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        // Search filter
        if (query.search) {
            const search = query.search.trim();
            const numericSearch = Number(search);
            const isNumeric = !isNaN(numericSearch);

            const dateFromSearch = new Date(search);
            const isValidDate = !isNaN(dateFromSearch.getTime());

            const tokens = search.split(/\s+/).filter(Boolean);
            const orConditions: any[] = [];

            for (const token of tokens) {
                orConditions.push({ firstName: { contains: token, mode: 'insensitive' } });
                orConditions.push({ lastName: { contains: token, mode: 'insensitive' } });
                orConditions.push({ email: { contains: token, mode: 'insensitive' } });
            }

            if (isNumeric) {
                orConditions.push({ salary: numericSearch });
            }

            if (isValidDate) {
                const startOfDay = new Date(dateFromSearch);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(dateFromSearch);
                endOfDay.setHours(23, 59, 59, 999);

                orConditions.push({
                    hireDate: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                });
            }

            where.OR = orConditions;
        }

        // Department filter
        if (query.departmentId) {
            where.departmentId = query.departmentId;
        }

        // Status filter
        if (query.status) {
            where.status = query.status;
        }

        // Role filter
        if (query.roleId) {
            where.roleId = query.roleId;
        }

        // Fetch employees and total count
        const [employees, total] = await Promise.all([
            employeeRepository.findAll({
                where,
                skip,
                take: limit,
                organizationId,
                orderBy: { createdAt: 'desc' },
            }),
            employeeRepository.count(organizationId, where),
        ]);

        return {
            employees,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get employee by ID
     */
    async getById(id: string, organizationId: string) {
        const employee = await employeeRepository.findById(id, organizationId);

        if (!employee) {
            throw new NotFoundError('Employee not found');
        }

        return employee;
    }

    /**
     * Create new employee
     */
    async create(data: CreateEmployeeDto, organizationId: string) {
        // Check if email already exists
        const existingEmployee = await employeeRepository.findByEmail(data.email, organizationId);
        if (existingEmployee) {
            throw new BadRequestError('Employee with this email already exists');
        }

        // Generate employee number
        const count = await employeeRepository.getEmployeeCount(organizationId);
        const employeeNumber = `EMP${String(count + 1).padStart(3, '0')}`;

        // Create employee
        const employee = await employeeRepository.create({
            employeeNumber,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            department: { connect: { id: data.departmentId } },
            role: { connect: { id: data.roleId } },
            hireDate: new Date(data.hireDate),
            salary: parseFloat(String(data.salary)),
            status: (data.status as any) || 'active',
            phoneNumber: data.phoneNumber,
            address: data.address,
            manager: data.managerId ? { connect: { id: data.managerId } } : undefined,
        }, organizationId);

        return employee;
    }

    /**
     * Update employee
     */
    async update(id: string, data: UpdateEmployeeDto, organizationId: string) {
        // Verify employee exists
        await this.getById(id, organizationId);

        const updateData: any = {};

        if (data.firstName) updateData.firstName = data.firstName;
        if (data.lastName) updateData.lastName = data.lastName;
        if (data.departmentId) updateData.department = { connect: { id: data.departmentId } };
        if (data.roleId) updateData.role = { connect: { id: data.roleId } };
        if (data.status) updateData.status = data.status;
        if (data.salary !== undefined) updateData.salary = parseFloat(String(data.salary));
        if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber;
        if (data.address) updateData.address = data.address;
        if (data.managerId) updateData.manager = { connect: { id: data.managerId } };

        const employee = await employeeRepository.update(id, updateData, organizationId);
        if (!employee) {
            throw new NotFoundError('Employee not found');
        }

        return employee;
    }

    /**
     * Delete employee
     */
    async delete(id: string, organizationId: string): Promise<void> {
        const employee = await employeeRepository.findById(id, organizationId);

        if (!employee) {
            throw new NotFoundError('Employee not found');
        }

        const userId = employee.userId;

        // Delete employee and associated user
        await employeeRepository.deleteWithUser(id, userId, organizationId);
    }
}

export const employeeService = new EmployeeService();
