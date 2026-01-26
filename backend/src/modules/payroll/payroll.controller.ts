import { Request, Response } from 'express';
import { payrollService } from './payroll.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';
import { ForbiddenError, BadRequestError } from '../../shared/utils/errors';
import { createAuditLog } from '../../shared/utils/audit';
import { AuthRequest } from '../../shared/middleware/auth';

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
    const authReq = req as unknown as AuthRequest;
    const result = await payrollService.generatePayroll(req.body);

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
    const record = await payrollService.updateStatus(req.params.id, req.body, authReq.user?.id);

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

    const records = await payrollService.getEmployeePayslips(employeeId);

    res.json({
        success: true,
        data: records,
    });
});

export const exportPayslipsCsv = asyncHandler(async (req: AuthRequest, res: Response) => {
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

    const { filename, csv } = await payrollService.exportEmployeePayslipsCsv(employeeId);

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

export const getOverride = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { employeeId, payPeriod } = req.params;

    const override = await payrollService.getOverride(employeeId, payPeriod);

    res.json({
        success: true,
        data: override,
    });
});

export const upsertOverride = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { employeeId, payPeriod } = req.params;

    const updated = await payrollService.upsertOverride(employeeId, payPeriod, req.body);

    const actorUserId = req.user?.id;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'payroll.override_upsert',
            resourceId: `${employeeId}:${payPeriod}`,
            newValues: { employeeId, payPeriod, config: updated },
            req,
        });
    }

    res.json({
        success: true,
        data: updated,
        message: 'Payroll override saved',
    });
});

export const deleteOverride = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { employeeId, payPeriod } = req.params;

    const removed = await payrollService.deleteOverride(employeeId, payPeriod);

    const actorUserId = req.user?.id;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'payroll.override_delete',
            resourceId: `${employeeId}:${payPeriod}`,
            newValues: { employeeId, payPeriod },
            req,
        });
    }

    res.json({
        success: true,
        data: { removed },
        message: removed ? 'Payroll override removed' : 'Payroll override not found',
    });
});

export const exportPayslipPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
    const permissions: string[] = Array.isArray(req.user?.permissions) ? req.user.permissions : [];
    const canViewAll = permissions.includes('payroll.view');

    const recordId = req.params.id;
    if (!recordId) {
        throw new BadRequestError('Payroll record ID is required');
    }

    const selfEmployeeId = req.user?.employeeId;
    const { filename, pdf, employeeId } = await payrollService.exportPayslipPdf(recordId);

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
    const summary = await payrollService.getPeriodSummary(req.params.payPeriod);

    res.json({
        success: true,
        data: summary,
    });
});

export const getConfig = asyncHandler(async (req: Request, res: Response) => {
    const config = await payrollService.getPayrollConfig();

    res.json({
        success: true,
        data: config,
    });
});

export const updateConfig = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as unknown as AuthRequest;
    const updated = await payrollService.updatePayrollConfig(req.body);

    const actorUserId = authReq.user?.id;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'payroll.update_config',
            resourceId: 'company-settings',
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

export const exportPeriodCsv = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payPeriod = req.params.payPeriod;

    if (!payPeriod) {
        throw new BadRequestError('Pay period is required');
    }

    const { filename, csv } = await payrollService.exportPayrollPeriodCsv(payPeriod);

    const actorUserId = req.user?.id;
    if (actorUserId) {
        await createAuditLog({
            userId: actorUserId,
            action: 'payroll.export_period_csv',
            resourceId: payPeriod,
            newValues: { payPeriod },
            req,
        });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
});
