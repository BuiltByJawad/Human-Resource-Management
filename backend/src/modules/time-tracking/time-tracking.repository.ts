
import { prisma } from '../../shared/config/database';
import { TimeEntry, Project } from '@prisma/client';

export class TimeTrackingRepository {
    async createProject(data: any): Promise<Project> {
        return prisma.project.create({ data });
    }

    async getProjects(): Promise<Project[]> {
        return prisma.project.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async createEntry(data: any): Promise<TimeEntry> {
        return prisma.timeEntry.create({ data });
    }

    async findActiveEntry(employeeId: string): Promise<TimeEntry | null> {
        return prisma.timeEntry.findFirst({
            where: {
                employeeId,
                endTime: null
            }
        });
    }

    async updateEntry(id: string, data: any): Promise<TimeEntry> {
        return prisma.timeEntry.update({
            where: { id },
            data
        });
    }

    async getEmployeeEntries(employeeId: string, startDate: Date, endDate: Date): Promise<TimeEntry[]> {
        return prisma.timeEntry.findMany({
            where: {
                employeeId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: { project: true },
            orderBy: { date: 'desc' }
        });
    }
}

export const timeTrackingRepository = new TimeTrackingRepository();
