import { Request, Response } from 'express';
import { payrollService } from './payroll.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';

/**
 * Get all payroll records
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await payrollService.getAll(req.query);

    res.json({
        success: true,
        data: result.records,
        pagination: result.pagination,
    });
});

/**
 * Get payroll record by ID
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
    const record = await payrollService.getById(req.params.id);

    res.json({
        success: true,
        data: record,
    });
});

/**
 * Generate payroll for a period
 */
export const generate = asyncHandler(async (req: Request, res: Response) => {
    const result = await payrollService.generatePayroll(req.body);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: result.message,
        data: result.payrolls,
    });
});

/**
 * Update payroll status
 */
export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const record = await payrollService.updateStatus(req.params.id, req.body);

    res.json({
        success: true,
        data: record,
        message: `Payroll status updated to ${req.body.status}`,
    });
});

/**
 * Get employee payslips
 */
export const getEmployeePayslips = asyncHandler(async (req: any, res: Response) => {
    const employeeId = req.params.employeeId || req.user?.employeeId;
    const records = await payrollService.getEmployeePayslips(employeeId);

    res.json({
        success: true,
        data: records,
    });
});

/**
 * Get payroll summary for a period
 */
export const getPeriodSummary = asyncHandler(async (req: Request, res: Response) => {
    const summary = await payrollService.getPeriodSummary(req.params.payPeriod);

    res.json({
        success: true,
        data: summary,
    });
});
