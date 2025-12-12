
import { shiftRepository } from './shift.repository';
import { CreateShiftDto, RequestSwapDto, UpdateSwapStatusDto } from './dto';
import { BadRequestError, NotFoundError } from '../../shared/utils/errors';

export class ShiftService {
    async scheduleShift(data: CreateShiftDto) {
        // Basic overlap check could be added here
        return shiftRepository.createShift({
            ...data,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime)
        });
    }

    async getRoster(startDate: string, endDate: string) {
        return shiftRepository.getShifts(new Date(startDate), new Date(endDate));
    }

    async requestSwap(requestorId: string, data: RequestSwapDto) {
        const shift = await shiftRepository.getShiftById(data.shiftId);
        if (!shift) throw new NotFoundError('Shift not found');
        if (shift.employeeId !== requestorId) throw new BadRequestError('You can only swap your own shifts');

        return shiftRepository.createSwapRequest({
            shiftId: data.shiftId,
            requestorId,
            targetId: data.targetId,
            reason: data.reason,
            status: 'pending'
        });
    }

    async approveSwap(requestId: string, status: 'approved' | 'rejected') {
        const swapRequest = await shiftRepository.getSwapRequestById(requestId);
        if (!swapRequest) throw new NotFoundError('Swap request not found');

        if (status === 'rejected') {
            return shiftRepository.updateSwapRequest(requestId, { status: 'rejected' });
        }

        // If approved, we need to execute the swap
        // Scenario: Reassign original shift to target (if target exists)
        // If open swap (no target), requires manual reassignment or claiming. 
        // For simple logic: assume targetId is present for direct swap, or just approve to notify admin.

        if (!swapRequest.targetId) {
            // Just mark approved, allow admin to reassign later
            return shiftRepository.updateSwapRequest(requestId, { status: 'approved' });
        }

        // Execute reassignment
        await shiftRepository.updateShift(swapRequest.shiftId, {
            employeeId: swapRequest.targetId
        });

        return shiftRepository.updateSwapRequest(requestId, { status: 'approved' });
    }
}

export const shiftService = new ShiftService();
