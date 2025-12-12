
import { prisma } from '../../shared/config/database';
import { TrainingCourse, EmployeeTraining } from '@prisma/client';

export class TrainingRepository {
    async createCourse(data: any): Promise<TrainingCourse> {
        return prisma.trainingCourse.create({ data });
    }

    async getCourses(): Promise<TrainingCourse[]> {
        return prisma.trainingCourse.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    async getCourseById(id: string): Promise<TrainingCourse | null> {
        return prisma.trainingCourse.findUnique({ where: { id } });
    }

    async assignCourse(data: any): Promise<EmployeeTraining> {
        return prisma.employeeTraining.create({ data });
    }

    async getEmployeeTraining(employeeId: string): Promise<EmployeeTraining[]> {
        return prisma.employeeTraining.findMany({
            where: { employeeId },
            include: { course: true },
            orderBy: { assignedDate: 'desc' }
        });
    }

    async getAssignmentById(id: string): Promise<EmployeeTraining | null> {
        return prisma.employeeTraining.findUnique({ where: { id } });
    }

    async updateProgress(id: string, data: any): Promise<EmployeeTraining> {
        return prisma.employeeTraining.update({
            where: { id },
            data
        });
    }
}

export const trainingRepository = new TrainingRepository();
