
import { Request, Response } from 'express'
import { prisma } from '@/shared/config/database';
import { asyncHandler } from '@/shared/middleware/errorHandler';

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const [
        totalEmployees,
        activeEmployees,
        totalDepartments,
        pendingLeaveRequests,
        latestPayrolls,
        todayAttendance
    ] = await Promise.all([
        prisma.employee.count(),
        prisma.employee.count({ where: { status: 'active' } }),
        prisma.department.count(),
        prisma.leaveRequest.count({ where: { status: 'pending' } }),
        prisma.payrollRecord.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100, // Approximate for "latest" batch
            distinct: ['employeeId'] // Get latest per employee
        }),
        prisma.attendance.count({
            where: {
                checkIn: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        })
    ])

    const totalPayroll = latestPayrolls.reduce((sum, record) => sum + Number(record.netSalary), 0)
    const attendanceRate = activeEmployees > 0 ? Math.round((todayAttendance / activeEmployees) * 100) : 0

    res.json({
        success: true,
        data: {
            totalEmployees,
            activeEmployees,
            totalDepartments,
            pendingLeaveRequests,
            totalPayroll,
            attendanceRate
        }
    })
})
