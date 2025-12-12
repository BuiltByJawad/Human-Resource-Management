
import { offboardingRepository } from './offboarding.repository';
import { InitiateOffboardingDto, UpdateOffboardingTaskDto } from './dto';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';

export class OffboardingService {
    async initiateOffboarding(data: InitiateOffboardingDto) {
        const { employeeId, exitDate, reason, notes } = data;

        // Check if already offboarding
        const existing = await offboardingRepository.getProcessByEmployeeId(employeeId);
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

        return offboardingRepository.getProcessById(process.id);
    }

    async getEmployeeOffboarding(employeeId: string) {
        const process = await offboardingRepository.getProcessByEmployeeId(employeeId);
        if (!process) {
            throw new NotFoundError('Offboarding process not found');
        }
        return process;
    }

    async updateTask(taskId: string, data: UpdateOffboardingTaskDto) {
        const updatedTask = await offboardingRepository.updateTask(taskId, {
            status: data.status,
            completedAt: data.status === 'completed' ? new Date() : null,
            completedBy: data.completedBy,
        });

        // Check if all tasks completed to update process status
        const process = await offboardingRepository.getProcessById(updatedTask.processId);
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
                await offboardingRepository.updateProcess(process.id, { status: 'completed' });
            } else if (process.status === 'pending') {
                await offboardingRepository.updateProcess(process.id, { status: 'in_progress' });
            }
        }

        return updatedTask;
    }

    async getAllProcesses() {
        return offboardingRepository.getAllProcesses();
    }
}

export const offboardingService = new OffboardingService();
