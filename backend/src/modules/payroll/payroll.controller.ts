import { Request, Response } from 'express';
import { payrollService } from './payroll.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';
import { ForbiddenError, BadRequestError } from '../../shared/utils/errors';
import { requireRequestOrganizationId } from '../../shared/utils/tenant';
import { createAuditLog } from '../../shared/utils/audit';
import { AuthRequest } from '../../shared/middleware/auth';

/**
 * Get all payroll records
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
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
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
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
    const authReq = req as unknown as AuthRequest;
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const result = await payrollService.generatePayroll(req.body, organizationId);

    const actorUserId = authReq.user?.id;
    const body: Record<string, unknown> =
        typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    const payPeriod = typeof body.payPeriod === 'string' ? body.payPeriod : undefined;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'payroll.generate',
            newValues: {
                payPeriod,
                generatedCount: Array.isArray(result.payrolls) ? result.payrolls.length : 0,
            },
            req,
        });
    }

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
    const authReq = req as unknown as AuthRequest;
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const record = await payrollService.updateStatus(req.params.id, req.body, organizationId);

    const actorUserId = authReq.user?.id;
    const body: Record<string, unknown> =
        typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    const status = typeof body.status === 'string' ? body.status : undefined;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'payroll.update_status',
            resourceId: record.id,
            newValues: {
                payrollRecordId: record.id,
                status,
            },
            req,
        });
    }

    res.json({
        success: true,
        data: record,
        message: `Payroll status updated to ${req.body.status}`,
    });
});

/**
 * Get employee payslips
 */
export const getEmployeePayslips = asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const permissions: string[] = Array.isArray(req.user?.permissions) ? req.user.permissions : [];
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

export const exportPayslipsCsv = asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const permissions: string[] = Array.isArray(req.user?.permissions) ? req.user.permissions : [];
    const canViewAll = permissions.includes('payroll.view');

    const requestedEmployeeId = req.params.employeeId;
    const selfEmployeeId = req.user?.employeeId;
    const employeeId = requestedEmployeeId || selfEmployeeId;

    if (!employeeId) {
        throw new BadRequestError('Employee ID is required');
    }

    if (!canViewAll && requestedEmployeeId && selfEmployeeId && requestedEmployeeId !== selfEmployeeId) {
        throw new ForbiddenError('You can only export your own payslips');
    }

    const { filename, csv } = await payrollService.exportEmployeePayslipsCsv(employeeId, organizationId);

    const actorUserId = req.user?.id;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'payroll.export_payslips_csv',
            resourceId: employeeId,
            newValues: { employeeId },
            req,
        });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
});

export const exportPayslipPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const permissions: string[] = Array.isArray(req.user?.permissions) ? req.user.permissions : [];
    const canViewAll = permissions.includes('payroll.view');

    const recordId = req.params.id;
    if (!recordId) {
        throw new BadRequestError('Payroll record ID is required');
    }

    const selfEmployeeId = req.user?.employeeId;
    const { filename, pdf, employeeId } = await payrollService.exportPayslipPdf(recordId, organizationId);

    if (!canViewAll && selfEmployeeId && employeeId !== selfEmployeeId) {
        throw new ForbiddenError('You can only export your own payslip');
    }

    const actorUserId = req.user?.id;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'payroll.export_payslip_pdf',
            resourceId: recordId,
            newValues: { recordId, employeeId },
            req,
        });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
});

/**
 * Get payroll summary for a period
 */
export const getPeriodSummary = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const summary = await payrollService.getPeriodSummary(req.params.payPeriod, organizationId);

    res.json({
        success: true,
        data: summary,
    });
});

export const getConfig = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);
    const config = await payrollService.getPayrollConfig(organizationId);

    res.json({
        success: true,
        data: config,
    });
});

export const updateConfig = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as unknown as AuthRequest;
    const organizationId = requireRequestOrganizationId(req as unknown as AuthRequest);

    const updated = await payrollService.updatePayrollConfig(req.body, organizationId);

    const actorUserId = authReq.user?.id;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'payroll.update_config',
            resourceId: organizationId,
            newValues: { payroll: updated },
            req,
        });
    }

    res.json({
        success: true,
        data: updated,
        message: 'Payroll configuration updated',
    });
});
