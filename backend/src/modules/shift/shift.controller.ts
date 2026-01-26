
import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { shiftService } from './shift.service';
import { createShiftSchema, requestSwapSchema, updateSwapStatusSchema } from './dto';

export const scheduleShift = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = createShiftSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const shift = await shiftService.scheduleShift(value);
    res.status(201).json({ success: true, data: shift });
});

export const getRoster = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) throw new Error("Start date and end date required");

    const roster = await shiftService.getRoster(startDate as string, endDate as string);
    res.json({ success: true, data: roster });
});

export const requestSwap = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = requestSwapSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const requestorEmployeeId = (req as any).user?.employeeId;
    if (!requestorEmployeeId) throw new Error("User not authenticated");

    const swapRequest = await shiftService.requestSwap(requestorEmployeeId, value);
    res.status(201).json({ success: true, data: swapRequest });
});

export const updateSwapStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error, value } = updateSwapStatusSchema.validate(req.body);
    if (error) throw new Error(error.details[0].message);

    const result = await shiftService.approveSwap(id, value.status);
    res.json({ success: true, data: result });
});
