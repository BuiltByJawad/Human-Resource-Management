import { Request, Response } from 'express';
import { employeeService } from './employee.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { HTTP_STATUS } from '../../shared/constants';

/**
 * Get all employees with pagination and filters
 */
export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await employeeService.getAll(req.query);

    res.json({
        status: 'success',
        data: result,
    });
});

/**
 * Get employee by ID
 */
export const getById = asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeeService.getById(req.params.id);

    res.json({
        status: 'success',
        data: { employee },
    });
});

/**
 * Create new employee
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeeService.create(req.body);

    res.status(HTTP_STATUS.CREATED).json({
        status: 'success',
        data: { employee },
    });
});

/**
 * Update employee
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
    const employee = await employeeService.update(req.params.id, req.body);

    res.json({
        status: 'success',
        data: { employee },
    });
});

/**
 * Delete employee
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
    await employeeService.delete(req.params.id);

    res.json({
        status: 'success',
        message: 'Employee deleted successfully',
    });
});
