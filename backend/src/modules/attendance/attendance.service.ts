import { attendanceRepository } from './attendance.repository';
import { BadRequestError, NotFoundError } from '../../shared/utils/errors';
import { CheckInDto, CheckOutDto, AttendanceQueryDto } from './dto';
import { PAGINATION } from '../../shared/constants';

export class AttendanceService {
    async getAll(query: AttendanceQueryDto) {
        const page = query.page || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.employeeId) where.employeeId = query.employeeId;
        if (query.startDate || query.endDate) {
            where.checkIn = {};
            if (query.startDate) where.checkIn.gte = new Date(query.startDate);
            if (query.endDate) where.checkIn.lte = new Date(query.endDate);
        }

        const [records, total] = await Promise.all([
            attendanceRepository.findAll({ where, skip, take: limit }),
            attendanceRepository.count(where),
        ]);

        return { records, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async checkIn(employeeId: string, data: CheckInDto) {
        // Check if already checked in today
        const todayRecord = await attendanceRepository.findTodayRecord(employeeId);
        if (todayRecord) {
            throw new BadRequestError('Already checked in today');
        }

        // TODO: Verify geofencing (latitude/longitude within allowed range)

        return attendanceRepository.create({
            employeeId,
            checkIn: new Date(),
            checkInLocation: `${data.latitude},${data.longitude}`,
        });
    }

    async checkOut(employeeId: string, data: CheckOutDto) {
        const todayRecord = await attendanceRepository.findTodayRecord(employeeId);
        if (!todayRecord) {
            throw new BadRequestError('No check-in found for today');
        }

        if (todayRecord.checkOut) {
            throw new BadRequestError('Already checked out');
        }

        const checkOutTime = new Date();
        const hoursWorked = (checkOutTime.getTime() - new Date(todayRecord.checkIn).getTime()) / (1000 * 60 * 60);

        return attendanceRepository.update(todayRecord.id, {
            checkOut: checkOutTime,
            checkOutLocation: `${data.latitude},${data.longitude}`,
            hoursWorked: parseFloat(hoursWorked.toFixed(2)),
        });
    }
}

export const attendanceService = new AttendanceService();
