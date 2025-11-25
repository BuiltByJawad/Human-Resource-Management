import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EmployeeRiskData {
    employeeId: string;
    employeeName: string;
    department: string;
    riskScore: number;
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    flags: string[];
    metrics: {
        avgOvertimeHours: number;
        daysSinceLastLeave: number;
        lateArrivals: number;
        totalWorkHours: number;
    };
}

export const getBurnoutAnalytics = async (req: Request, res: Response) => {
    try {
        const { period = '30' } = req.query; // Default to last 30 days
        const days = parseInt(period as string);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch all active employees
        const employees = await prisma.employee.findMany({
            where: { status: 'active' },
            include: {
                department: true,
                attendance: {
                    where: {
                        checkIn: { gte: startDate }
                    }
                },
                leaveRequests: {
                    where: {
                        status: 'approved',
                        endDate: { gte: startDate }
                    },
                    orderBy: { endDate: 'desc' }
                }
            }
        });

        const riskData: EmployeeRiskData[] = [];

        for (const employee of employees) {
            const metrics = calculateMetrics(employee, startDate);
            const { riskScore, riskLevel, flags } = calculateRiskScore(metrics);

            riskData.push({
                employeeId: employee.id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                department: employee.department?.name || 'Unassigned',
                riskScore,
                riskLevel,
                flags,
                metrics
            });
        }

        // Sort by risk score descending
        riskData.sort((a, b) => b.riskScore - a.riskScore);

        // Calculate summary statistics
        const summary = {
            totalEmployees: employees.length,
            criticalRisk: riskData.filter(e => e.riskLevel === 'Critical').length,
            highRisk: riskData.filter(e => e.riskLevel === 'High').length,
            mediumRisk: riskData.filter(e => e.riskLevel === 'Medium').length,
            lowRisk: riskData.filter(e => e.riskLevel === 'Low').length,
            avgRiskScore: riskData.reduce((sum, e) => sum + e.riskScore, 0) / riskData.length || 0
        };

        res.json({
            summary,
            employees: riskData,
            period: days
        });
    } catch (error) {
        console.error('Error calculating burnout analytics:', error);
        res.status(500).json({ error: 'Failed to calculate burnout analytics' });
    }
};

function calculateMetrics(employee: any, startDate: Date) {
    const attendance = employee.attendance;

    // Calculate average overtime hours
    const totalOvertimeHours = attendance.reduce((sum: number, record: any) => {
        return sum + (record.overtimeHours ? parseFloat(record.overtimeHours.toString()) : 0);
    }, 0);
    const avgOvertimeHours = attendance.length > 0 ? totalOvertimeHours / attendance.length : 0;

    // Calculate total work hours
    const totalWorkHours = attendance.reduce((sum: number, record: any) => {
        return sum + (record.workHours ? parseFloat(record.workHours.toString()) : 0);
    }, 0);

    // Count late arrivals
    const lateArrivals = attendance.filter((record: any) => record.status === 'late').length;

    // Calculate days since last approved leave
    let daysSinceLastLeave = 999; // Default to high number if no leave found
    if (employee.leaveRequests && employee.leaveRequests.length > 0) {
        const lastLeave = employee.leaveRequests[0]; // Already sorted by endDate desc
        const daysDiff = Math.floor((Date.now() - new Date(lastLeave.endDate).getTime()) / (1000 * 60 * 60 * 24));
        daysSinceLastLeave = Math.max(0, daysDiff);
    }

    return {
        avgOvertimeHours,
        daysSinceLastLeave,
        lateArrivals,
        totalWorkHours
    };
}

function calculateRiskScore(metrics: any): { riskScore: number; riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'; flags: string[] } {
    let score = 0;
    const flags: string[] = [];

    // Overtime fatigue (0-40 points)
    if (metrics.avgOvertimeHours > 15) {
        score += 40;
        flags.push(`Excessive overtime: ${metrics.avgOvertimeHours.toFixed(1)}h avg/day`);
    } else if (metrics.avgOvertimeHours > 10) {
        score += 30;
        flags.push(`High overtime: ${metrics.avgOvertimeHours.toFixed(1)}h avg/day`);
    } else if (metrics.avgOvertimeHours > 5) {
        score += 15;
        flags.push(`Moderate overtime: ${metrics.avgOvertimeHours.toFixed(1)}h avg/day`);
    }

    // Leave deprivation (0-35 points)
    if (metrics.daysSinceLastLeave > 180) {
        score += 35;
        flags.push(`No leave in ${Math.floor(metrics.daysSinceLastLeave / 30)} months`);
    } else if (metrics.daysSinceLastLeave > 120) {
        score += 25;
        flags.push(`No leave in ${Math.floor(metrics.daysSinceLastLeave / 30)} months`);
    } else if (metrics.daysSinceLastLeave > 90) {
        score += 15;
        flags.push(`No leave in 3+ months`);
    }

    // Attendance strain (0-25 points)
    if (metrics.lateArrivals > 10) {
        score += 25;
        flags.push(`${metrics.lateArrivals} late arrivals`);
    } else if (metrics.lateArrivals > 5) {
        score += 15;
        flags.push(`${metrics.lateArrivals} late arrivals`);
    } else if (metrics.lateArrivals > 2) {
        score += 8;
        flags.push(`${metrics.lateArrivals} late arrivals`);
    }

    // Determine risk level
    let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
    if (score >= 70) {
        riskLevel = 'Critical';
    } else if (score >= 50) {
        riskLevel = 'High';
    } else if (score >= 30) {
        riskLevel = 'Medium';
    } else {
        riskLevel = 'Low';
    }

    return { riskScore: score, riskLevel, flags };
}
