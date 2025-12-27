import { Request, Response } from 'express';
import { payrollService } from './payroll.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';
import { ForbiddenError, BadRequestError } from '../../shared/utils/errors';
import { requireRequestOrganizationId } from '../../shared/utils/tenant';

/**
 * Get all payroll records
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const result = await payrollService.getAll(req.query, organizationId);

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
    const organizationId = requireRequestOrganizationId(req as any);
    const record = await payrollService.getById(req.params.id, organizationId);

    res.json({
        success: true,
        data: record,
    });
});

/**
 * Generate payroll for a period
 */
export const generate = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const result = await payrollService.generatePayroll(req.body, organizationId);

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
    const organizationId = requireRequestOrganizationId(req as any);
    const record = await payrollService.updateStatus(req.params.id, req.body, organizationId);

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
    const organizationId = requireRequestOrganizationId(req as any);
    const permissions: string[] = Array.isArray(req?.user?.permissions) ? req.user.permissions : [];
    const canViewAll = permissions.includes('payroll.view');

    const requestedEmployeeId = req.params.employeeId;
    const selfEmployeeId = req.user?.employeeId;
    const employeeId = requestedEmployeeId || selfEmployeeId;

    if (!employeeId) {
        throw new BadRequestError('Employee ID is required');
    }

    if (!canViewAll && requestedEmployeeId && selfEmployeeId && requestedEmployeeId !== selfEmployeeId) {
        throw new ForbiddenError('You can only view your own payslips');
    }

    const records = await payrollService.getEmployeePayslips(employeeId, organizationId);

    res.json({
        success: true,
        data: records,
    });
});

/**
 * Get payroll summary for a period
 */
export const getPeriodSummary = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as any);
    const summary = await payrollService.getPeriodSummary(req.params.payPeriod, organizationId);

    res.json({
        success: true,
        data: summary,
    });
});
