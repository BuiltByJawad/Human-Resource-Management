
import { offboardingRepository } from './offboarding.repository';
import { InitiateOffboardingDto, UpdateOffboardingTaskDto } from './dto';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { prisma } from '../../shared/config/database';
import { notificationService } from '../notification/notification.service';

export class OffboardingService {
    private async resolveEmployeeUserId(employeeId: string, organizationId: string): Promise<string | null> {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, organizationId },
            select: { userId: true },
        });
        return employee?.userId ?? null;
    }

    private async resolveUsersByRoleNames(roleNames: string[], organizationId: string): Promise<string[]> {
        if (!roleNames.length) return [];
        const users = await prisma.user.findMany({
            where: {
                organizationId,
                status: 'active',
                role: {
                    name: { in: roleNames },
                },
            },
            select: { id: true },
            take: 50,
        });
        return users.map((u) => u.id);
    }

    private async resolveUsersWithPermission(resource: string, action: string, organizationId: string): Promise<string[]> {
        const users = await prisma.user.findMany({
            where: {
                organizationId,
                status: 'active',
                role: {
                    permissions: {
                        some: {
                            permission: { resource, action },
                        },
                    },
                },
            },
            select: { id: true },
            take: 50,
        });
        return users.map((u) => u.id);
    }

    async initiateOffboarding(data: InitiateOffboardingDto, organizationId: string) {
        const { employeeId, exitDate, reason, notes } = data;

        const employeeInTenant = await prisma.employee.findFirst({
            where: { id: employeeId, organizationId },
            select: { id: true },
        });
        if (!employeeInTenant) {
            throw new NotFoundError('Employee not found');
        }

        // Check if already offboarding
        const existing = await offboardingRepository.getProcessByEmployeeId(employeeId, organizationId);
        if (existing) {
            throw new BadRequestError('Offboarding process already initiated for this employee');
        }

        // Create process
        const process = await offboardingRepository.createProcess({
            employeeId,
            exitDate: new Date(exitDate),
            reason,
            notes,
            status: 'pending',
        });

        // Generate default tasks
        const defaultTasks = [
            { title: 'Return Laptop', description: 'Return company laptop and accessories', assigneeRole: 'IT' },
            { title: 'Revoke System Access', description: 'Disable email and system accounts', assigneeRole: 'IT' },
            { title: 'Exit Interview', description: 'Conduct exit interview with HR', assigneeRole: 'HR' },
            { title: 'Return ID Badge', description: 'Return building access card', assigneeRole: 'HR' },
            { title: 'Final Paycheck Processing', description: 'Calculate final settlement', assigneeRole: 'HR' },
        ];

        const tasksData = defaultTasks.map(t => ({
            processId: process.id,
            title: t.title,
            description: t.description,
            assigneeRole: t.assigneeRole,
            status: 'pending',
        }));

        await offboardingRepository.createTasks(tasksData);

        const employeeUserId = await this.resolveEmployeeUserId(employeeId, organizationId);
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, organizationId },
            select: { firstName: true, lastName: true },
        });
        const employeeName = `${employee?.firstName ?? ''} ${employee?.lastName ?? ''}`.trim() || 'Employee';

        const hrUserIds = await this.resolveUsersWithPermission('offboarding', 'manage', organizationId);
        const itUserIds = await this.resolveUsersByRoleNames(['IT Admin', 'IT'], organizationId);

        const uniqueRecipients = (ids: string[]) => Array.from(new Set(ids.filter(Boolean)));

        if (employeeUserId) {
            await notificationService.create({
                userId: employeeUserId,
                title: 'Offboarding initiated',
                message: `An offboarding process has been initiated for you. Exit date: ${new Date(exitDate).toDateString()}.`,
                type: 'offboarding',
                link: '/offboarding',
            });
        }

        await Promise.all(
            uniqueRecipients(hrUserIds).map((userId) =>
                notificationService.create({
                    userId,
                    title: 'Offboarding initiated',
                    message: `Offboarding started for ${employeeName}. Reason: ${reason}.`,
                    type: 'offboarding',
                    link: '/offboarding',
                })
            )
        );

        const hasItTasks = defaultTasks.some((t) => t.assigneeRole === 'IT');
        if (hasItTasks) {
            await Promise.all(
                uniqueRecipients(itUserIds).map((userId) =>
                    notificationService.create({
                        userId,
                        title: 'Offboarding tasks assigned',
                        message: `New offboarding tasks require IT action for ${employeeName}.`,
                        type: 'offboarding',
                        link: '/offboarding',
                    })
                )
            );
        }

        return offboardingRepository.getProcessById(process.id, organizationId);
    }

    async getEmployeeOffboarding(employeeId: string, organizationId: string) {
        const process = await offboardingRepository.getProcessByEmployeeId(employeeId, organizationId);
        if (!process) {
            throw new NotFoundError('Offboarding process not found');
        }
        return process;
    }

    async updateTask(taskId: string, data: UpdateOffboardingTaskDto, organizationId: string) {
        const updatedTask = await offboardingRepository.updateTask(taskId, {
            status: data.status,
            completedAt: data.status === 'completed' ? new Date() : null,
            completedBy: data.completedBy,
        }, organizationId);

        if (!updatedTask) {
            throw new NotFoundError('Offboarding task not found');
        }

        // Check if all tasks completed to update process status
        const process = await offboardingRepository.getProcessById(updatedTask.processId, organizationId);
        if (process) {
            const tasks = (process as any).tasks || []; // Relation might not be loaded if using basic findUnique unless included
            // Actually repo getProcessById includes tasks.
            // We need to fetch it with tasks to be sure or trust the relation returned by updateTask return? 
            // UpdateTask returns Task, not Process. 
            // getProcessById includes tasks.

            // Check if 'tasks' property exists on type (Prisma issue again?)
            // Adding 'as any' to be safe given previous onboarding experience.
            const allTasks = (process as any).tasks;
            const allCompleted = allTasks.every((t: any) => t.status === 'completed' || t.status === 'skipped');

            if (allCompleted) {
                await offboardingRepository.updateProcess(process.id, { status: 'completed' }, organizationId);
            } else if (process.status === 'pending') {
                await offboardingRepository.updateProcess(process.id, { status: 'in_progress' }, organizationId);
            }

            if (data.status === 'completed') {
                const hrUserIds = await this.resolveUsersWithPermission('offboarding', 'manage', organizationId);
                await Promise.all(
                    Array.from(new Set(hrUserIds)).map((userId) =>
                        notificationService.create({
                            userId,
                            title: 'Offboarding task completed',
                            message: `Task completed: ${updatedTask.title}`,
                            type: 'offboarding',
                            link: '/offboarding',
                        })
                    )
                );
            }

            if (allCompleted) {
                const fullProcess = await offboardingRepository.getProcessByEmployeeId((process as any).employeeId, organizationId);
                const employeeId = (process as any).employeeId as string;
                const employeeUserId = await this.resolveEmployeeUserId(employeeId, organizationId);
                if (employeeUserId) {
                    await notificationService.create({
                        userId: employeeUserId,
                        title: 'Offboarding completed',
                        message: 'All offboarding tasks have been completed.',
                        type: 'offboarding',
                        link: '/offboarding',
                    });
                }
            }
        }

        return updatedTask;
    }

    async getAllProcesses(organizationId: string) {
        return offboardingRepository.getAllProcesses(organizationId);
    }
}

export const offboardingService = new OffboardingService();
