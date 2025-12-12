
import { trainingRepository } from './training.repository';
import { CreateCourseDto, AssignTrainingDto, UpdateProgressDto } from './dto';
import { BadRequestError, NotFoundError } from '../../shared/utils/errors';

export class TrainingService {
    async createCourse(data: CreateCourseDto) {
        return trainingRepository.createCourse(data);
    }

    async getCourses() {
        return trainingRepository.getCourses();
    }

    async assignCourse(data: AssignTrainingDto) {
        // Correct overlap/duplicate check handling
        // Prisma will throw error on unique constraint if duplicated, 
        // OR we can check manually. Let's rely on Prisma for simplicity or add check.
        try {
            return await trainingRepository.assignCourse({
                ...data,
                status: 'assigned',
                progress: 0
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new BadRequestError('Employee already assigned to this course');
            }
            throw error;
        }
    }

    async getEmployeeTraining(employeeId: string) {
        return trainingRepository.getEmployeeTraining(employeeId);
    }

    async updateProgress(assignmentId: string, employeeId: string, data: UpdateProgressDto) {
        const assignment = await trainingRepository.getAssignmentById(assignmentId);
        if (!assignment) throw new NotFoundError('Training assignment not found');
        if (assignment.employeeId !== employeeId) throw new BadRequestError('Access denied');

        let status = data.status || assignment.status;
        if (data.progress === 100) {
            status = 'completed';
        } else if (data.progress > 0 && status === 'assigned') {
            status = 'in-progress';
        }

        return trainingRepository.updateProgress(assignmentId, {
            progress: data.progress,
            status,
            completionDate: status === 'completed' && !assignment.completionDate ? new Date() : assignment.completionDate
        });
    }
}

export const trainingService = new TrainingService();
