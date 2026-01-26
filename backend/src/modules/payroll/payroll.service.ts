import { payrollRepository } from './payroll.repository';
import { NotFoundError, BadRequestError } from '../../shared/utils/errors';
import { GeneratePayrollDto, UpdatePayrollStatusDto, PayrollQueryDto } from './dto';
import { PAGINATION } from '../../shared/constants';
import { prisma } from '../../shared/config/database';
import { notificationService } from '../notification/notification.service';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';

type PayrollConfigItem = {
    name: string;
    type: 'fixed' | 'percentage';
    value: number;
};

export type PayrollConfig = {
    allowances: PayrollConfigItem[];
    deductions: PayrollConfigItem[];
};

const DEFAULT_PAYROLL_CONFIG: PayrollConfig = {
    allowances: [{ name: 'Standard Allowance', type: 'percentage', value: 10 }],
    deductions: [{ name: 'Tax', type: 'percentage', value: 5 }],
};

const toSettingsObject = (value: unknown): Record<string, unknown> => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }

    return {};
};

const normalizeConfigItem = (value: unknown): PayrollConfigItem | null => {
    if (!value || typeof value !== 'object') return null;
    const obj = value as Record<string, unknown>;
    const name = typeof obj.name === 'string' ? obj.name : '';
    const type = obj.type === 'fixed' || obj.type === 'percentage' ? obj.type : null;
    const num = typeof obj.value === 'number' && Number.isFinite(obj.value) ? obj.value : null;
    if (!name || !type || num === null || num < 0) return null;
    return { name, type, value: num };
};

const normalizePayrollConfig = (value: unknown): PayrollConfig => {
    if (!value || typeof value !== 'object') return DEFAULT_PAYROLL_CONFIG;
    const obj = value as Record<string, unknown>;

    const allowancesRaw = Array.isArray(obj.allowances) ? obj.allowances : [];
    const deductionsRaw = Array.isArray(obj.deductions) ? obj.deductions : [];

    const allowances = allowancesRaw.map(normalizeConfigItem).filter((x): x is PayrollConfigItem => x !== null);
    const deductions = deductionsRaw.map(normalizeConfigItem).filter((x): x is PayrollConfigItem => x !== null);

    return {
        allowances: allowances.length ? allowances : DEFAULT_PAYROLL_CONFIG.allowances,
        deductions: deductions.length ? deductions : DEFAULT_PAYROLL_CONFIG.deductions,
    };
};

export class PayrollService {
    async getPayrollConfig(): Promise<PayrollConfig> {
        const settings = (await prisma.companySettings.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { payrollConfig: true },
        })) as { payrollConfig?: Prisma.InputJsonValue | null } | null;
        const root = toSettingsObject(settings?.payrollConfig);
        return normalizePayrollConfig(root);
    }

    async getOverride(employeeId: string, payPeriod: string): Promise<PayrollConfig | null> {
        const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
        if (!periodRegex.test(payPeriod)) {
            throw new BadRequestError('Invalid pay period format. Use YYYY-MM (e.g., 2024-01)');
        }

        const record = await payrollRepository.findOverride(employeeId, payPeriod);
        if (!record) return null;
        return normalizePayrollConfig(record.config);
    }

    async upsertOverride(
        employeeId: string,
        payPeriod: string,
        config: PayrollConfig,
        
    ): Promise<PayrollConfig> {
        const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
        if (!periodRegex.test(payPeriod)) {
            throw new BadRequestError('Invalid pay period format. Use YYYY-MM (e.g., 2024-01)');
        }

        const employeeExists = await prisma.employee.findFirst({
            where: { id: employeeId },
            select: { id: true },
        });
        if (!employeeExists) {
            throw new NotFoundError('Employee not found');
        }

        const saved = await payrollRepository.upsertOverride(
            employeeId,
            payPeriod,
            config as unknown as Prisma.InputJsonValue
        );

        return normalizePayrollConfig(saved.config);
    }

    async deleteOverride(employeeId: string, payPeriod: string): Promise<boolean> {
        const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
        if (!periodRegex.test(payPeriod)) {
            throw new BadRequestError('Invalid pay period format. Use YYYY-MM (e.g., 2024-01)');
        }
        const deletedCount = await payrollRepository.deleteOverride(employeeId, payPeriod);
        return deletedCount > 0;
    }

    async updatePayrollConfig(config: PayrollConfig): Promise<PayrollConfig> {
        const settings = await prisma.companySettings.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { id: true },
        });

        if (!settings) {
            const created = (await prisma.companySettings.create({
                data: { payrollConfig: config as unknown as Prisma.InputJsonValue },
                select: { payrollConfig: true },
            })) as { payrollConfig?: Prisma.InputJsonValue | null };
            return normalizePayrollConfig(toSettingsObject(created.payrollConfig));
        }

        const updated = (await prisma.companySettings.update({
            where: { id: settings.id },
            data: { payrollConfig: config as unknown as Prisma.InputJsonValue },
            select: { payrollConfig: true },
        })) as { payrollConfig?: Prisma.InputJsonValue | null };

        const updatedRoot = toSettingsObject(updated.payrollConfig);
        return normalizePayrollConfig(updatedRoot);
    }

    private async resolveEmployeeUserId(employeeId: string): Promise<string | null> {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId },
            select: { userId: true },
        });
        return employee?.userId ?? null;
    }

    private async resolvePayrollAdminUserIds(): Promise<string[]> {
        const users = await prisma.user.findMany({
            where: {
                status: 'active',
                role: {
                    permissions: {
                        some: {
                            permission: {
                                resource: 'payroll',
                                action: { in: ['manage', 'generate', 'configure'] },
                            },
                        },
                    },
                },
            },
            select: { id: true },
            take: 50,
        });
        return users.map((u) => u.id);
    }

    /**
     * Get all payroll records with pagination
     */
    async getAll(query: PayrollQueryDto) {
        const page = query.page || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        const where: any = {};

        if (query.payPeriod) {
            where.payPeriod = query.payPeriod;
        }

        if (query.status) {
            where.status = query.status;
        }

        if (query.employeeId) {
            where.employeeId = query.employeeId;
        }

        const [records, total] = await Promise.all([
            payrollRepository.findAll({ where, skip, take: limit }),
            payrollRepository.count(where),
        ]);

        return {
            records,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get payroll record by ID
     */
    async getById(id: string) {
        const record = await payrollRepository.findById(id);

        if (!record) {
            throw new NotFoundError('Payroll record not found');
        }

        return record;
    }

    /**
     * Generate payroll for a period
     */
    async generatePayroll(data: GeneratePayrollDto) {
        // Validate pay period format (YYYY-MM)
        const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
        if (!periodRegex.test(data.payPeriod)) {
            throw new BadRequestError('Invalid pay period format. Use YYYY-MM (e.g., 2024-01)');
        }

        // Get active employees with attendance for the period
        const employees = await payrollRepository.getActiveEmployeesWithAttendance(
            data.payPeriod,
            data.employeeIds
        );

        if (employees.length === 0) {
            throw new BadRequestError('No active employees found for payroll generation');
        }

        const payrollConfig = await this.getPayrollConfig();

        const employeeIds = employees.map((e) => e.id);
        const overrides = await payrollRepository.findOverridesForEmployees(data.payPeriod, employeeIds);
        const overrideByEmployeeId = new Map<string, PayrollConfig>();
        for (const o of overrides) {
            overrideByEmployeeId.set(o.employeeId, normalizePayrollConfig(o.config));
        }

        const payrolls = [];

        for (const employee of employees) {
            // Calculate payroll
            const effectiveConfig = overrideByEmployeeId.get(employee.id) ?? payrollConfig;
            const calculation = this.calculatePayroll(employee, data.payPeriod, effectiveConfig);

            // Upsert payroll record
            const payroll = await payrollRepository.upsert({
                employeeId: employee.id,
                payPeriod: data.payPeriod,
                ...calculation,
                status: 'draft',
            });

            payrolls.push(payroll);
        }

        const payrollAdminIds = await this.resolvePayrollAdminUserIds();
        await Promise.all(
            Array.from(new Set(payrollAdminIds)).map((userId) =>
                notificationService.create({
                    userId,
                    title: 'Payroll generated',
                    message: `Payroll has been generated for period ${data.payPeriod} (${payrolls.length} employee(s)).`,
                    type: 'payroll',
                    link: '/payroll',
                })
            )
        );

        return {
            message: `Generated payroll for ${payrolls.length} employees`,
            payrolls,
        };
    }

    /**
     * Calculate payroll for an employee
     */
    private calculatePayroll(employee: any, payPeriod: string, payrollConfig: PayrollConfig) {
        const baseSalary = Number(employee.salary);

        const resolveAmount = (item: PayrollConfigItem): number => {
            if (item.type === 'fixed') return item.value;
            return (baseSalary * item.value) / 100;
        };

        const allowancesBreakdown = payrollConfig.allowances.map((item) => ({
            name: item.name,
            type: item.type,
            value: item.value,
            amount: resolveAmount(item),
        }));

        const deductionsBreakdown = payrollConfig.deductions.map((item) => ({
            name: item.name,
            type: item.type,
            value: item.value,
            amount: resolveAmount(item),
        }));

        const allowances = allowancesBreakdown.reduce((sum, item) => sum + item.amount, 0);
        const deductions = deductionsBreakdown.reduce((sum, item) => sum + item.amount, 0);
        const netSalary = baseSalary + allowances - deductions;

        // Attendance summary
        const daysWorked = employee.attendance?.length || 0;
        const totalOvertime = employee.attendance?.reduce(
            (acc: number, curr: any) => acc + Number(curr.overtimeHours || 0),
            0
        ) || 0;

        return {
            baseSalary,
            allowances,
            deductions,
            netSalary,
            allowancesBreakdown,
            deductionsBreakdown,
            attendanceSummary: {
                daysWorked,
                totalOvertime,
            },
        };
    }

    /**
     * Update payroll status
     */
    async updateStatus(id: string, data: UpdatePayrollStatusDto, actorUserId?: string) {
        const existing = await this.getById(id); // Verify exists

        const nextStatus = data?.status;
        const currentStatus = existing.status;

        if (nextStatus === currentStatus) {
            return existing;
        }

        const allowedTransitions: Record<string, Set<string>> = {
            draft: new Set(['processed']),
            processed: new Set(['paid']),
            paid: new Set([]),
        };

        const allowedNext = allowedTransitions[String(currentStatus)];
        if (!allowedNext || !allowedNext.has(String(nextStatus))) {
            throw new BadRequestError(`Invalid payroll status transition: ${String(currentStatus)} -> ${String(nextStatus)}`);
        }

        let paidAt: Date | undefined;
        if (data.status === 'paid') {
            if (typeof data.paymentMethod !== 'string' || data.paymentMethod.trim().length === 0) {
                throw new BadRequestError('paymentMethod is required when marking payroll as paid');
            }
            if (typeof data.paidAt !== 'string' || data.paidAt.trim().length === 0) {
                throw new BadRequestError('paidAt is required when marking payroll as paid');
            }
            const parsed = new Date(data.paidAt);
            if (Number.isNaN(parsed.getTime())) {
                throw new BadRequestError('paidAt must be a valid ISO date string');
            }
            paidAt = parsed;
        }

        const record = await payrollRepository.updateStatus(id, {
            status: data.status,
            paidAt,
            paymentMethod: typeof data.paymentMethod === 'string' ? data.paymentMethod : undefined,
            paymentReference: typeof data.paymentReference === 'string' ? data.paymentReference : undefined,
            paidByUserId: data.status === 'paid' ? actorUserId : undefined,
        });
        if (!record) {
            throw new NotFoundError('Payroll record not found');
        }

        if (data.status === 'paid') {
            const employeeUserId = await this.resolveEmployeeUserId(existing.employeeId);
            if (employeeUserId) {
                await notificationService.create({
                    userId: employeeUserId,
                    title: 'Payslip available',
                    message: `Your payslip for ${existing.payPeriod} is now available.`,
                    type: 'payroll',
                    link: '/payroll',
                });
            }
        }

        return record;
    }

    /**
     * Get employee payslips
     */
    async getEmployeePayslips(employeeId: string) {
        const records = await payrollRepository.findByEmployee(employeeId);

        return records;
    }

    async exportEmployeePayslipsCsv(employeeId: string): Promise<{ filename: string; csv: string }> {
        const records = await payrollRepository.findByEmployeeForExport(employeeId);

        const escapeCsv = (value: string): string => {
            const needsQuotes = /[",\n\r]/.test(value);
            const escaped = value.replace(/"/g, '""');
            return needsQuotes ? `"${escaped}"` : escaped;
        };

        const toCell = (value: unknown): string => {
            if (value === null || value === undefined) return '';
            if (typeof value === 'number') return String(value);
            if (typeof value === 'string') return escapeCsv(value);
            if (value instanceof Date) return escapeCsv(value.toISOString());
            return escapeCsv(String(value));
        };

        const headers = [
            'Pay Period',
            'Employee Number',
            'Employee Name',
            'Department',
            'Base Salary',
            'Allowances',
            'Deductions',
            'Net Salary',
            'Status',
            'Processed At',
        ];

        const rows = records.map((r) => {
            const employeeName = `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}`.trim();
            return [
                toCell(r.payPeriod),
                toCell(r.employee?.employeeNumber ?? ''),
                toCell(employeeName),
                toCell(r.employee?.department?.name ?? ''),
                toCell(Number(r.baseSalary)),
                toCell(Number(r.allowances)),
                toCell(Number(r.deductions)),
                toCell(Number(r.netSalary)),
                toCell(String(r.status)),
                toCell(r.processedAt ?? null),
            ].join(',');
        });

        const csv = `${headers.join(',')}\n${rows.join('\n')}`;
        return {
            filename: `payslips-${employeeId}.csv`,
            csv,
        };
    }

    async exportPayslipPdf(
        recordId: string
    ): Promise<{ filename: string; pdf: Buffer; employeeId: string }> {
        const record = await this.getById(recordId);

        const employeeName = `${record.employee?.firstName ?? ''} ${record.employee?.lastName ?? ''}`.trim();
        const employeeNumber = record.employee?.employeeNumber ?? '';
        const departmentName = record.employee?.department?.name ?? '';

        const allowancesBreakdown = Array.isArray(record.allowancesBreakdown) ? record.allowancesBreakdown : [];
        const deductionsBreakdown = Array.isArray(record.deductionsBreakdown) ? record.deductionsBreakdown : [];

        const doc = new PDFDocument({ size: 'A4', margin: 48 });

        const chunks: Buffer[] = [];
        const pdf: Buffer = await new Promise((resolve, reject) => {
            doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.fontSize(18).text('Payslip', { align: 'center' });
            doc.moveDown(1);

            doc.fontSize(11);
            doc.text(`Pay Period: ${record.payPeriod}`);
            doc.text(`Employee: ${employeeName || 'N/A'}`);
            doc.text(`Employee Number: ${employeeNumber || 'N/A'}`);
            doc.text(`Department: ${departmentName || 'N/A'}`);
            doc.text(`Status: ${String(record.status)}`);
            doc.text(`Processed At: ${record.processedAt ? record.processedAt.toISOString() : 'N/A'}`);
            doc.moveDown(1);

            doc.fontSize(12).text('Summary', { underline: true });
            doc.moveDown(0.5);

            doc.fontSize(11);
            doc.text(`Base Salary: ${Number(record.baseSalary).toFixed(2)}`);
            doc.text(`Allowances: ${Number(record.allowances).toFixed(2)}`);
            doc.text(`Deductions: ${Number(record.deductions).toFixed(2)}`);
            doc.text(`Net Salary: ${Number(record.netSalary).toFixed(2)}`);
            doc.moveDown(1);

            const writeBreakdown = (title: string, items: unknown[]) => {
                doc.fontSize(12).text(title, { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(11);

                if (!items.length) {
                    doc.text('N/A');
                    doc.moveDown(1);
                    return;
                }

                for (const raw of items) {
                    if (!raw || typeof raw !== 'object') continue;
                    const obj = raw as Record<string, unknown>;
                    const name = typeof obj.name === 'string' ? obj.name : 'Item';
                    const amount = typeof obj.amount === 'number' ? obj.amount : Number(obj.amount);
                    const amountText = Number.isFinite(amount) ? amount.toFixed(2) : '';
                    doc.text(`${name}: ${amountText}`);
                }
                doc.moveDown(1);
            };

            writeBreakdown('Allowances Breakdown', allowancesBreakdown);
            writeBreakdown('Deductions Breakdown', deductionsBreakdown);

            doc.end();
        });

        return {
            filename: `payslip-${employeeNumber || record.employeeId}-${record.payPeriod}.pdf`,
            pdf,
            employeeId: record.employeeId,
        };
    }

    async exportPayrollPeriodCsv(
        payPeriod: string
    ): Promise<{ filename: string; csv: string }> {
        const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
        if (!periodRegex.test(payPeriod)) {
            throw new BadRequestError('Invalid pay period format. Use YYYY-MM (e.g., 2024-01)');
        }

        const records = await payrollRepository.findByPeriodForExport(payPeriod);

        const escapeCsv = (value: string): string => {
            const needsQuotes = /[",\n\r]/.test(value);
            const escaped = value.replace(/"/g, '""');
            return needsQuotes ? `"${escaped}"` : escaped;
        };

        const toCell = (value: unknown): string => {
            if (value === null || value === undefined) return '';
            if (typeof value === 'number') return String(value);
            if (typeof value === 'string') return escapeCsv(value);
            if (value instanceof Date) return escapeCsv(value.toISOString());
            return escapeCsv(String(value));
        };

        const headers = [
            'Pay Period',
            'Employee Number',
            'Employee Name',
            'Department',
            'Base Salary',
            'Allowances',
            'Deductions',
            'Net Salary',
            'Status',
            'Processed At',
        ];

        const rows = records.map((r) => {
            const employeeName = `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}`.trim();
            return [
                toCell(r.payPeriod),
                toCell(r.employee?.employeeNumber ?? ''),
                toCell(employeeName),
                toCell(r.employee?.department?.name ?? ''),
                toCell(Number(r.baseSalary)),
                toCell(Number(r.allowances)),
                toCell(Number(r.deductions)),
                toCell(Number(r.netSalary)),
                toCell(String(r.status)),
                toCell(r.processedAt ?? null),
            ].join(',');
        });

        const csv = `${headers.join(',')}\n${rows.join('\n')}`;
        return {
            filename: `payroll-${payPeriod}.csv`,
            csv,
        };
    }

    /**
     * Get payroll summary for a period
     */
    async getPeriodSummary(payPeriod: string) {
        const records = await payrollRepository.findByPeriod(payPeriod);

        const summary = {
            totalEmployees: records.length,
            totalBaseSalary: records.reduce((sum, r) => sum + Number(r.baseSalary), 0),
            totalAllowances: records.reduce((sum, r) => sum + Number(r.allowances), 0),
            totalDeductions: records.reduce((sum, r) => sum + Number(r.deductions), 0),
            totalNetSalary: records.reduce((sum, r) => sum + Number(r.netSalary), 0),
            statusBreakdown: {
                draft: records.filter(r => (r.status as any) === 'draft').length,
                approved: records.filter(r => (r.status as any) === 'approved').length,
                paid: records.filter(r => (r.status as any) === 'paid').length,
            },
        };

        return summary;
    }
}

export const payrollService = new PayrollService();
