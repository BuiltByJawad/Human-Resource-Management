import { Request, Response } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { AuthRequest } from '../../shared/middleware/auth';
import { BadRequestError, UnauthorizedError } from '../../shared/utils/errors';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../shared/constants';

const assertTrustedOriginForCookieAuth = (req: Request) => {
    // Only enforce in production to avoid breaking local dev environments.
    if (process.env.NODE_ENV !== 'production') return;

    const origin = req.get('origin');
    if (!origin) return;

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) return;

    try {
        const expected = new URL(frontendUrl);
        const actual = new URL(origin);
        if (expected.origin !== actual.origin) {
            throw new BadRequestError('Invalid request origin');
        }
    } catch {
        throw new BadRequestError('Invalid request origin');
    }
};

const getRefreshCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production';
    const refreshDays = Number(process.env.JWT_REFRESH_EXPIRATION_DAYS || 30);
    const maxAgeMs = Number.isFinite(refreshDays) ? Math.max(1, refreshDays) * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    // If frontend and backend are on different sites in production, SameSite=None is required.
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
        path: '/api/auth',
        maxAge: maxAgeMs,
    };
};

/**
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register({
        ...(req.body as any),
    } as any);

    res.cookie('refreshToken', result.refreshToken, getRefreshCookieOptions());

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: {
            ...result,
            refreshToken: undefined,
        },
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
    const result = await authService.login({
        ...(req.body as any),
    } as any);

    // MFA-enabled accounts return a special shape that does not yet include tokens.
    if ((result as any)?.requiresMfa) {
        res.json({
            success: true,
            data: result,
        });
        return;
    }

    res.cookie('refreshToken', (result as any).refreshToken, getRefreshCookieOptions());

    res.json({
        success: true,
        data: {
            ...(result as any),
            refreshToken: undefined,
        },
    });
});

/**
 * Refresh token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const body: Record<string, unknown> =
        typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    const refreshToken =
        typeof body.refreshToken === 'string' && body.refreshToken.length > 0
            ? body.refreshToken
            : typeof (req as any).cookies?.refreshToken === 'string'
                ? (req as any).cookies.refreshToken
                : '';

    const usingCookie = !(typeof body.refreshToken === 'string' && body.refreshToken.length > 0);
    if (usingCookie) {
        assertTrustedOriginForCookieAuth(req);
    }

    if (!refreshToken) {
        throw new BadRequestError('refreshToken is required');
    }

    const result = await authService.refreshAccessToken({ refreshToken } as any);

    res.cookie('refreshToken', result.refreshToken, getRefreshCookieOptions());

    res.json({
        success: true,
        data: {
            ...result,
            refreshToken: undefined,
        },
    });
});

/**
 * Get profile
 */
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
    }

    res.json({
        success: true,
        data: {
            user: req.user,
            permissions: req.user.permissions,
        },
    });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
    }

    const body: Record<string, unknown> =
        typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
    const refreshToken =
        typeof body.refreshToken === 'string' && body.refreshToken.length > 0
            ? body.refreshToken
            : typeof (req as any).cookies?.refreshToken === 'string'
                ? (req as any).cookies.refreshToken
                : '';

    const usingCookie = !(typeof body.refreshToken === 'string' && body.refreshToken.length > 0);
    if (usingCookie) {
        assertTrustedOriginForCookieAuth(req as unknown as Request);
    }

    if (!refreshToken) {
        throw new BadRequestError('refreshToken is required');
    }

    await authService.logout(req.user.id, refreshToken);

    res.clearCookie('refreshToken', getRefreshCookieOptions());

    res.json({
        success: true,
        message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
    });
});

/**
 * Verify MFA code (step 2) and issue full auth tokens
 */
export const verifyMfa = asyncHandler(async (req: Request, res: Response) => {
    const { mfaToken, code } = req.body as { mfaToken?: string; code?: string };

    if (!mfaToken || typeof mfaToken !== 'string') {
        throw new BadRequestError('mfaToken is required');
    }

    if (!code || typeof code !== 'string') {
        throw new BadRequestError('MFA code is required');
    }

    const result = await authService.verifyMfa(mfaToken, code);

    res.cookie('refreshToken', result.refreshToken, getRefreshCookieOptions());

    res.json({
        success: true,
        data: {
            ...result,
            refreshToken: undefined,
        },
    });
});

/**
 * Start MFA enrollment for the authenticated user
 */
export const startMfaEnrollment = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
    }

    const result = await authService.startMfaEnrollment(req.user.id);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
    });
});

/**
 * Confirm MFA enrollment by verifying the first TOTP code
 */
export const confirmMfaEnrollment = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
    }

    const { code, enrollmentToken } = req.body as { code?: string; enrollmentToken?: string };
    if (!code || typeof code !== 'string') {
        throw new BadRequestError('MFA code is required');
    }

    if (!enrollmentToken || typeof enrollmentToken !== 'string') {
        throw new BadRequestError('enrollmentToken is required');
    }

    await authService.confirmMfaEnrollment(req.user.id, code, enrollmentToken);

    res.json({
        success: true,
        message: 'Multi-factor authentication enabled successfully',
    });
});

/**
 * Disable MFA for the current user
 */
export const disableMfa = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
    }

    const { code } = (req.body || {}) as { code?: string };

    await authService.disableMfa(req.user.id, typeof code === 'string' ? code : undefined);

    res.json({
        success: true,
        message: 'Multi-factor authentication disabled successfully',
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
