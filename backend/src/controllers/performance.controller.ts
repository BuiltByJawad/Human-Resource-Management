import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Review Cycles ---

export const createReviewCycle = async (req: Request, res: Response) => {
    try {
        const { title, startDate, endDate } = req.body;
        const cycle = await prisma.reviewCycle.create({
            data: {
                title,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                status: 'active'
            }
        });
        res.status(201).json(cycle);
    } catch (error) {
        console.error('Error creating review cycle:', error);
        res.status(500).json({ error: 'Failed to create review cycle' });
    }
};

export const getReviewCycles = async (req: Request, res: Response) => {
    try {
        const cycles = await prisma.reviewCycle.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(cycles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch review cycles' });
    }
};

// --- Performance Reviews ---

export const createReview = async (req: Request, res: Response) => {
    try {
        const { employeeId, reviewerId, cycleId, type, ratings, comments } = req.body;
        const userId = (req as any).user?.id;

        // Resolve Reviewer's Employee ID
        const reviewerUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { employee: true }
        });

        if (!reviewerUser?.employee) {
            return res.status(400).json({ error: 'Reviewer must have an employee record' });
        }
        const actualReviewerId = reviewerUser.employee.id;

        // Resolve Subject's Employee ID
        let actualEmployeeId = actualReviewerId; // Default to self
        if (employeeId && employeeId !== userId) {
            const subjectUser = await prisma.user.findUnique({
                where: { id: employeeId },
                include: { employee: true }
            });
            if (!subjectUser?.employee) {
                return res.status(400).json({ error: 'Subject must have an employee record' });
            }
            actualEmployeeId = subjectUser.employee.id;
        }

        // Check if review already exists
        const existing = await prisma.performanceReview.findFirst({
            where: {
                employeeId: actualEmployeeId,
                reviewerId: actualReviewerId,
                cycleId
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'Review already exists for this cycle' });
        }

        const review = await prisma.performanceReview.create({
            data: {
                employeeId: actualEmployeeId,
                reviewerId: actualReviewerId,
                cycleId,
                type,
                ratings,
                comments,
                status: 'submitted'
            }
        });

        res.status(201).json(review);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
};

export const getEmployeeReviews = async (req: Request, res: Response) => {
    try {
        const { employeeId } = req.params;

        // Try to find employee by userId first (since frontend sends user.id)
        const employee = await prisma.employee.findUnique({
            where: { userId: employeeId }
        });

        const targetEmployeeId = employee ? employee.id : employeeId;

        const reviews = await prisma.performanceReview.findMany({
            where: { employeeId: targetEmployeeId },
            include: {
                reviewer: {
                    select: { firstName: true, lastName: true }
                },
                cycle: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

// --- AI Summarization (Mock) ---

export const summarizeFeedback = async (req: Request, res: Response) => {
    try {
        const { reviews } = req.body;

        // Mock AI response
        const summary = `Based on ${reviews.length} reviews, the employee shows strong leadership skills and technical proficiency. Areas for improvement include communication frequency and delegation.`;

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        res.json({ summary });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate summary' });
    }
};
