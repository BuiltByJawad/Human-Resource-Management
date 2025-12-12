
import { onboardingRepository } from './onboarding.repository';
import { CreateTemplateDto, CreateTaskDto, StartOnboardingDto, UpdateTaskStatusDto } from './dto';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';

export class OnboardingService {
    async createTemplate(data: CreateTemplateDto) {
        return onboardingRepository.createTemplate(data);
    }

    async getTemplates() {
        return onboardingRepository.getTemplates();
    }

    async addTaskToTemplate(data: CreateTaskDto) {
        const template = await onboardingRepository.getTemplateById(data.templateId);
        if (!template) {
            throw new NotFoundError('Onboarding template not found');
        }
        return onboardingRepository.createTask(data);
    }

    async startOnboarding(data: StartOnboardingDto) {
        const { employeeId, templateId, startDate } = data;

        // Check if process already exists
        const existing = await onboardingRepository.getProcessByEmployeeId(employeeId);
        if (existing) {
            throw new BadRequestError('Onboarding process already started for this employee');
        }

        const template = await onboardingRepository.getTemplateById(templateId);
        if (!template) {
            throw new NotFoundError('Onboarding template not found');
        }

        // Create process
        const process = await onboardingRepository.createProcess({
            employeeId,
            templateId,
            startDate: new Date(startDate),
            status: 'pending',
        });

        // Create task instances
        const taskInstances = (template as any).tasks.map((task: any) => ({
            processId: process.id,
            title: task.title,
            description: task.description,
            status: 'pending', // Explicitly pending
            assigneeID: task.assigneeRole === 'Self' ? employeeId : undefined, // Assign to employee if Self
            dueDate: addDays(new Date(startDate), task.dueInDays),
        }));

        if (taskInstances.length > 0) {
            await onboardingRepository.createTaskInstances(taskInstances);
        }

        return onboardingRepository.getProcessById(process.id);
    }

    async getEmployeeOnboarding(employeeId: string) {
        const process = await onboardingRepository.getProcessByEmployeeId(employeeId);
        if (!process) {
            throw new NotFoundError('Onboarding process not found');
        }
        return process;
    }

    async updateTaskStatus(taskId: string, data: UpdateTaskStatusDto) {
        // 1. Update the task instance
        // Assuming repository handles update correctly

        // We need to fetch the task first to know the process ID, unless repo returns it
        // The repository updateTaskInstance returns the updated record.
        const updatedTask = await onboardingRepository.updateTaskInstance(taskId, {
            status: data.status,
            completedAt: data.status === 'completed' ? new Date() : null,
            completedBy: data.completedBy,
        });

        // 2. Recalculate process progress
        const process = await onboardingRepository.getProcessById(updatedTask.processId);
        if (process) {
            const totalTasks = (process as any).tasks.length;
            const completedTasks = (process as any).tasks.filter((t: any) => t.status === 'completed' || t.status === 'skipped').length;

            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            let status = process.status;
            if (progress === 100) status = 'completed';
            else if (progress > 0 && status === 'pending') status = 'in_progress';

            await onboardingRepository.updateProcess(process.id, {
                progress,
                status,
            });
        }

        return updatedTask;
    }

    async getDashboard() {
        return onboardingRepository.getAllProcesses();
    }
}

export const onboardingService = new OnboardingService();

// Helper 
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
