import { Request, Response } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { AuthRequest } from '../../shared/middleware/auth';
import { TenantRequest } from '../../shared/middleware/tenant';
import { BadRequestError, UnauthorizedError } from '../../shared/utils/errors';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../shared/constants';

/**
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
    const tenantReq = req as TenantRequest;
    const organizationId = tenantReq.tenant?.id;

    const result = await authService.register({
        ...(req.body as any),
        organizationId,
    } as any);
    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: result,
    });
});

/**
 * Invite a user
 */
export const inviteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.inviteUser(req.body as any, req.user!.id);
    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: result,
        message: 'Invite generated. Share the link with the employee.',
    });
});

/**
 * Complete invite
 */
export const completeInvite = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.completeInvite(req.body as any);
    res.json({
        success: true,
        data: result,
    });
});

/**
 * Request password reset
 */
export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.requestPasswordReset(req.body as any);
    res.json({
        success: true,
        data: result,
        message: 'If this email exists, a reset link will be sent.',
    });
});

/**
 * Reset password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body as any);
    res.json({
        success: true,
        message: 'Password reset successfully',
    });
});

/**
 * Login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
    const tenantReq = req as TenantRequest;
    const organizationId = tenantReq.tenant?.id;

    const result = await authService.login({
        ...(req.body as any),
        organizationId,
    } as any);
    res.json({
        success: true,
        data: result,
    });
});

/**
 * Refresh token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refreshAccessToken(req.body as any);
    res.json({
        success: true,
        data: result,
    });
});

/**
 * Get profile
 */
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
    }

    // Fetch fresh user data
    const user = await authService.refreshAccessToken({ refreshToken: '' }).catch(() => null);

    res.json({
        success: true,
        data: {
            user: req.user,
            permissions: req.user.permissions,
        },
    });
});

/**
 * Upload avatar
 */
export const uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
    }

    const file = (req as any).file as any;
    if (!file) {
        throw new BadRequestError('No file uploaded');
    }

    let avatarUrl: string;

    // Handle cloudinary or local upload
    if (file.path && typeof file.path === 'string' && /^https?:\/\//.test(file.path)) {
        avatarUrl = file.path;
    } else {
        const baseUrl = process.env.FILE_BASE_URL || `${req.protocol}://${req.get('host')}`;
        const filename =
            file.filename ||
            (typeof file.path === 'string' ? file.path.split(/[\\/]/).pop() : undefined);

        if (!filename) {
            throw new BadRequestError('Unable to determine uploaded file name');
        }

        avatarUrl = `${baseUrl}/uploads/${filename}`;
    }

    const result = await authService.uploadAvatar(req.user.id, avatarUrl);

    res.json({
        success: true,
        data: result,
    });
});

/**
 * Change password
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
    }

    await authService.changePassword(req.user.id, req.body);

    res.json({
        success: true,
        message: 'Password changed successfully',
    });
});

/**
 * Update profile
 */
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
    }

    const result = await authService.updateProfile(req.user.id, req.user.email, req.body);

    res.json({
        success: true,
        data: result,
    });
});
