import { Request, Response } from 'express';
import { prisma } from '@/shared/config/database';
import { requireRequestOrganizationId } from '@/shared/utils/tenant';

// Generate payroll for a specific period (e.g., "2023-10")
export const generatePayroll = async (req: Request, res: Response) => {
    try {
        const { payPeriod } = req.body; // Format: "YYYY-MM"

        const organizationId = requireRequestOrganizationId(req as any);

        if (!payPeriod) {
            return res.status(400).json({ error: 'Pay period is required (YYYY-MM)' });
        }

        // 1. Get all active employees
        const employees = await prisma.employee.findMany({
            where: { status: 'active', organizationId } as any,
            include: {
                attendance: {
                    where: {
                        checkIn: {
                            gte: new Date(`${payPeriod}-01`),
                            lt: new Date(`${payPeriod}-31`), // Rough approximation, better to use date-fns start/end of month
                        }
                    }
                }
            }
        });

        const payrolls = [];

        // 2. Calculate payroll for each employee
        for (const employee of employees) {
            // Basic calculation logic (can be expanded)
            const baseSalary = Number(employee.salary);

            // Mock calculation for allowances/deductions based on attendance or fixed rules
            // In a real app, this would come from an 'EmployeeSalaryStructure' model
            const allowances = baseSalary * 0.1; // 10% allowance example
            const deductions = baseSalary * 0.05; // 5% tax example

            const netSalary = baseSalary + allowances - deductions;

            // Attendance summary
            const daysWorked = employee.attendance.length;
            const totalOvertime = employee.attendance.reduce((acc, curr) => acc + Number(curr.overtimeHours || 0), 0);

            const payroll = await prisma.payrollRecord.upsert({
                where: {
                    employeeId_payPeriod: {
                        employeeId: employee.id,
                        payPeriod
                    }
                },
                update: {
                    baseSalary,
                    allowances,
                    deductions,
                    netSalary,
                    allowancesBreakdown: [{ name: 'Standard Allowance', amount: allowances }],
                    deductionsBreakdown: [{ name: 'Tax', amount: deductions }],
                    attendanceSummary: { daysWorked, totalOvertime },
                    status: 'draft'
                },
                create: {
                    employeeId: employee.id,
                    payPeriod,
                    baseSalary,
                    allowances,
                    deductions,
                    netSalary,
                    allowancesBreakdown: [{ name: 'Standard Allowance', amount: allowances }],
                    deductionsBreakdown: [{ name: 'Tax', amount: deductions }],
                    attendanceSummary: { daysWorked, totalOvertime },
                    status: 'draft'
                }
            });

            payrolls.push(payroll);
        }

        res.json({ message: `Generated payroll for ${payrolls.length} employees`, data: payrolls });
    } catch (error: any) {
        console.error('Error generating payroll:', JSON.stringify(error, null, 2));
        res.status(500).json({
            error: 'Failed to generate payroll',
            details: error.message || 'Unknown server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get all payroll records (for Admin)
export const getPayrollRecords = async (req: Request, res: Response) => {
    try {
        const organizationId = requireRequestOrganizationId(req as any);
        const { payPeriod, status } = req.query;

        const where: any = {};
        if (payPeriod) where.payPeriod = String(payPeriod);
        if (status) where.status = String(status);

        const records = await prisma.payrollRecord.findMany({
            where: { ...where, employee: { organizationId } } as any,
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeNumber: true,
                        department: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(records);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payroll records' });
    }
};

// Update payroll status (Approve/Pay)
export const updatePayrollStatus = async (req: Request, res: Response) => {
    try {
        const organizationId = requireRequestOrganizationId(req as any);
        const { id } = req.params;
        const { status } = req.body;

        const updated = await prisma.payrollRecord.updateMany({
            where: { id, employee: { organizationId } } as any,
            data: {
                status,
                processedAt: status === 'paid' ? new Date() : undefined
            } as any
        });

        if (!updated.count) {
            return res.status(404).json({ error: 'Payroll record not found' });
        }

        const record = await prisma.payrollRecord.findFirst({
            where: { id, employee: { organizationId } } as any,
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeNumber: true,
                        department: { select: { name: true } }
                    }
                }
            }
        });

        res.json(record);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update payroll status' });
    }
};

// Get payslips for logged-in employee
export const getEmployeePayslips = async (req: Request, res: Response) => {
    try {
        const organizationId = requireRequestOrganizationId(req as any);
        const userId = (req as any).user?.id || (req as any).user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const employee = await prisma.employee.findFirst({
            where: { userId, organizationId } as any
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee record not found' });
        }

        const records = await prisma.payrollRecord.findMany({
            where: { employeeId: employee.id, employee: { organizationId } } as any,
            orderBy: { payPeriod: 'desc' }
        });

        res.json(records);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payslips' });
    }
};
