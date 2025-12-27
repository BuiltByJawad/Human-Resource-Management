
import { shiftRepository } from './shift.repository';
import { CreateShiftDto, RequestSwapDto, UpdateSwapStatusDto } from './dto';
import { BadRequestError, NotFoundError } from '../../shared/utils/errors';
import { prisma } from '../../shared/config/database';

export class ShiftService {
    async scheduleShift(organizationId: string, data: CreateShiftDto) {
        const employeeExists = await prisma.employee.findFirst({ where: { id: data.employeeId, organizationId } });
        if (!employeeExists) {
            throw new NotFoundError('Employee not found');
        }

        // Basic overlap check could be added here
        return shiftRepository.createShift({
            ...data,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime)
        });
    }

    async getRoster(organizationId: string, startDate: string, endDate: string) {
        return shiftRepository.getShifts(organizationId, new Date(startDate), new Date(endDate));
    }

    async requestSwap(organizationId: string, requestorId: string, data: RequestSwapDto) {
        const shift = await shiftRepository.getShiftById(organizationId, data.shiftId);
        if (!shift) throw new NotFoundError('Shift not found');
        if (shift.employeeId !== requestorId) throw new BadRequestError('You can only swap your own shifts');

        if (data.targetId) {
            const targetExists = await prisma.employee.findFirst({ where: { id: data.targetId, organizationId } });
            if (!targetExists) {
                throw new NotFoundError('Target employee not found');
            }
        }

        return shiftRepository.createSwapRequest({
            shiftId: data.shiftId,
            requestorId,
            targetId: data.targetId,
            reason: data.reason,
            status: 'pending'
        });
    }

    async approveSwap(organizationId: string, requestId: string, status: 'approved' | 'rejected') {
        const swapRequest = await shiftRepository.getSwapRequestById(organizationId, requestId);
        if (!swapRequest) throw new NotFoundError('Swap request not found');

        if (status === 'rejected') {
            const updated = await shiftRepository.updateSwapRequest(organizationId, requestId, { status: 'rejected' });
            if (!updated) throw new NotFoundError('Swap request not found');
            return updated;
        }

        // If approved, we need to execute the swap
        // Scenario: Reassign original shift to target (if target exists)
        // If open swap (no target), requires manual reassignment or claiming. 
        // For simple logic: assume targetId is present for direct swap, or just approve to notify admin.

        if (!swapRequest.targetId) {
            // Just mark approved, allow admin to reassign later
            const updated = await shiftRepository.updateSwapRequest(organizationId, requestId, { status: 'approved' });
            if (!updated) throw new NotFoundError('Swap request not found');
            return updated;
        }

        // Execute reassignment
        const shiftUpdated = await shiftRepository.updateShift(organizationId, swapRequest.shiftId, {
            employeeId: swapRequest.targetId
        });
        if (!shiftUpdated) throw new NotFoundError('Shift not found');

        const updated = await shiftRepository.updateSwapRequest(organizationId, requestId, { status: 'approved' });
        if (!updated) throw new NotFoundError('Swap request not found');
        return updated;
    }
}

export const shiftService = new ShiftService();
