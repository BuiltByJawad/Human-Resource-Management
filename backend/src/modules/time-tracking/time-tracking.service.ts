
import { timeTrackingRepository } from './time-tracking.repository';
import { CreateProjectDto, ClockInDto, ManualEntryDto } from './dto';
import { BadRequestError, NotFoundError } from '../../shared/utils/errors';
import { differenceInMinutes } from 'date-fns';

export class TimeTrackingService {
    async createProject(data: CreateProjectDto) {
        return timeTrackingRepository.createProject({
            ...data,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : null
        });
    }

    async getProjects() {
        return timeTrackingRepository.getProjects();
    }

    async clockIn(data: ClockInDto) {
        const active = await timeTrackingRepository.findActiveEntry(data.employeeId);
        if (active) {
            throw new BadRequestError('You are already clocked in');
        }

        return timeTrackingRepository.createEntry({
            employeeId: data.employeeId,
            projectId: data.projectId,
            date: new Date(data.date),
            startTime: new Date(data.startTime),
            description: data.description,
            status: 'pending'
        });
    }

    async clockOut(employeeId: string, endTime: string) {
        const active = await timeTrackingRepository.findActiveEntry(employeeId);
        if (!active) {
            throw new BadRequestError('No active clock-in found');
        }

        const end = new Date(endTime);
        const duration = differenceInMinutes(end, active.startTime);

        return timeTrackingRepository.updateEntry(active.id, {
            endTime: end,
            duration: duration > 0 ? duration : 0,
            status: 'approved' // Auto-approve for now or keep pending
        });
    }

    async logManualEntry(data: ManualEntryDto) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        const duration = differenceInMinutes(end, start);

        return timeTrackingRepository.createEntry({
            employeeId: data.employeeId,
            projectId: data.projectId,
            date: new Date(data.date),
            startTime: start,
            endTime: end,
            duration: duration > 0 ? duration : 0,
            description: data.description,
            status: 'pending'
        });
    }

    async getTimesheet(employeeId: string, startDate: string, endDate: string) {
        // Simple date parsing, assuming YYYY-MM-DD
        const start = new Date(startDate);
        const end = new Date(endDate);
        return timeTrackingRepository.getEmployeeEntries(employeeId, start, end);
    }
}

export const timeTrackingService = new TimeTrackingService();
