import { authRepository } from './auth.repository';
import {
    hashPassword,
    comparePassword,
    generateTokens,
    validatePasswordStrength,
} from '../../shared/utils/auth';
import { createAuditLog } from '../../shared/utils/audit';
import {
    BadRequestError,
    UnauthorizedError,
} from '../../shared/utils/errors';
import {
    RegisterDto,
    LoginDto,
    InviteUserDto,
    CompleteInviteDto,
    PasswordResetRequestDto,
    PasswordResetDto,
    ChangePasswordDto,
    RefreshTokenDto,
    UpdateProfileDto,
    AuthResponse,
    StartMfaEnrollmentResponse,
} from './dto';
import config from '../../shared/config/config';
import {
    deleteRefreshJti,
    ensureRedisConnected,
    rotateRefreshJtiIfPresent,
    storeRefreshJti,
    verifyRefreshToken,
} from './auth.tokens';
import { signMfaToken, verifyMfaToken } from './auth.mfa';
import { flattenPermissions, mapAuthUser } from './auth.mappers';
import { inviteUserUsecase } from './usecases/inviteUser.usecase';
import { completeInviteUsecase } from './usecases/completeInvite.usecase';
import { requestPasswordResetUsecase, resetPasswordUsecase } from './usecases/passwordReset.usecase';
import { confirmMfaEnrollmentUsecase, disableMfaUsecase, startMfaEnrollmentUsecase } from './usecases/mfaEnrollment.usecase';
import { updateProfileUsecase } from './usecases/updateProfile.usecase';
import { uploadAvatarUsecase } from './usecases/uploadAvatar.usecase';
import { verifyMfaCode } from '../../shared/utils/mfa';

export class AuthService {
    /**
     * Register a new user
     */
    async register(data: RegisterDto): Promise<AuthResponse> {
        const { email, password, firstName, lastName } = data;

        const passwordError = validatePasswordStrength(password);
        if (passwordError) {
            throw new BadRequestError(passwordError);
        }

        // Check if user exists
        const existingUser = await authRepository.findUserByEmail(email);
        if (existingUser) {
            throw new BadRequestError('Email already in use');
        }

        // Find or create default role
        let defaultRole = await authRepository.findRoleByName('Employee');
        if (!defaultRole) {
            // This should not happen in production, handled by seeding
            throw new BadRequestError('Default role not found. Please contact administrator.');
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await authRepository.createUser({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: { connect: { id: defaultRole.id } },
            status: 'active',
        });

        const redisOk = await ensureRedisConnected();

        // Generate tokens
        const tokens = generateTokens(user.id, user.email, user.role.name);

        if (redisOk) {
            await storeRefreshJti(user.id, tokens.refreshTokenJti);
        }

        // Audit log
        await createAuditLog({
            userId: user.id,
            action: 'auth.register',
            resourceId: user.id,
        });

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role.name,
            },
        };
    }

    /**
     * Invite a user
     */
    async inviteUser(data: InviteUserDto, invitedBy: string): Promise<{ inviteId: string; inviteLink: string }> {
        return inviteUserUsecase(data, invitedBy);
    }

    /**
     * Complete invite and activate account
     */
    async completeInvite(data: CompleteInviteDto): Promise<{ userId: string; email: string }> {
        return completeInviteUsecase(data);
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(data: PasswordResetRequestDto): Promise<{ resetLink: string }> {
        return requestPasswordResetUsecase(data);
    }

    /**
     * Reset password using token
     */
    async resetPassword(data: PasswordResetDto): Promise<void> {
        await resetPasswordUsecase(data);
    }

    /**
     * Login user (step 1 for MFA-enabled accounts)
     */
    async login(data: LoginDto): Promise<AuthResponse | { requiresMfa: true; mfaToken: string; user: any }> {
        const { email, password } = data;

        const user = await authRepository.findUserByEmail(email);

        const isActive = user?.status ? String(user.status).toLowerCase() === 'active' : false;
        if (!user || !isActive) {
            throw new UnauthorizedError('Invalid credentials or inactive account');
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            // Audit failed login
            await createAuditLog({
                userId: user.id,
                action: 'auth.login_failed',
                resourceId: user.id,
            });
            throw new UnauthorizedError('Invalid credentials');
        }

        const redisOk = await ensureRedisConnected();

        // Flatten permissions eagerly for both MFA and non-MFA responses
        const permissions = flattenPermissions(user as any);

        const isPrivilegedRole = ['Super Admin', 'HR Admin'].includes(user.role.name);

        // If MFA is enabled, perform a two-step flow: return an MFA token instead of full auth tokens.
        if (user.mfaEnabled && user.mfaSecret) {
            const mfaToken = signMfaToken({
                userId: user.id,
                email: user.email,
                type: 'mfa',
            });

            return {
                requiresMfa: true,
                mfaToken,
                user: mapAuthUser(user as any),
            } as any;
        }

        // Non-MFA or not yet enrolled: issue tokens directly.
        const tokens = generateTokens(user.id, user.email, user.role.name);

        if (redisOk) {
            await storeRefreshJti(user.id, tokens.refreshTokenJti);
        }

        // Update last login
        await authRepository.updateUser(user.id, {
            lastLogin: new Date(),
        });

        // Audit successful login
        await createAuditLog({
            userId: user.id,
            action: 'auth.login',
            resourceId: user.id,
        });

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: mapAuthUser(user as any),
            permissions,
            mustSetupMfa: !user.mfaEnabled && isPrivilegedRole,
        };
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(data: RefreshTokenDto): Promise<AuthResponse> {
        const { refreshToken } = data;

        // Verify refresh token
        let payload: any;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }

        if (!payload || (!payload.userId && !payload.email)) {
            throw new UnauthorizedError('Invalid refresh token payload');
        }

        const tokenUserId: string | undefined = typeof payload?.userId === 'string' ? payload.userId : undefined;
        const tokenJti: string | undefined = typeof payload?.jti === 'string' ? payload.jti : undefined;
        const tokenIssuedAt: number | undefined = typeof payload?.iat === 'number' ? payload.iat : undefined;

        const maxSessionDays =
            typeof config.jwt.maxSessionDays === 'number' && Number.isFinite(config.jwt.maxSessionDays)
                ? config.jwt.maxSessionDays
                : 30;
        const maxSessionSeconds = Math.max(1, Math.floor(maxSessionDays * 24 * 60 * 60));
        if (tokenIssuedAt && Date.now() / 1000 - tokenIssuedAt > maxSessionSeconds) {
            throw new UnauthorizedError('Session expired');
        }

        const redisOk = await ensureRedisConnected();
        if (redisOk) {
            if (!tokenUserId || !tokenJti) {
                throw new UnauthorizedError('Invalid or expired refresh token');
            }
            const rotated = await rotateRefreshJtiIfPresent(tokenUserId, tokenJti);
            if (!rotated) {
                throw new UnauthorizedError('Invalid or expired refresh token');
            }
        }

        // Get user (prefer userId from token, fallback to email)
        const user = payload?.userId
            ? await authRepository.findUserById(payload.userId)
            : await authRepository.findUserByEmail(payload.email);

        const isActive = user?.status ? String(user.status).toLowerCase() === 'active' : false
        if (!user || !isActive) {
            throw new UnauthorizedError('User not found or inactive');
        }

        // Generate new tokens
        const tokens = generateTokens(user.id, user.email, user.role!.name);

        if (redisOk) {
            await storeRefreshJti(user.id, tokens.refreshTokenJti);
        }

        // Get permissions
        const userWithPerms = await authRepository.findUserByEmail(user.email);
        const permissions = userWithPerms ? flattenPermissions(userWithPerms as any) : [];

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: mapAuthUser(user as any),
            permissions,
        };
    }

    async logout(userId: string, refreshToken: string): Promise<void> {
        let payload: any;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }

        const tokenUserId: string | undefined = typeof payload?.userId === 'string' ? payload.userId : undefined;
        const tokenJti: string | undefined = typeof payload?.jti === 'string' ? payload.jti : undefined;

        if (!tokenUserId || tokenUserId !== userId) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        const redisOk = await ensureRedisConnected();
        if (redisOk && tokenJti) {
            await deleteRefreshJti(userId, tokenJti);
        }

        await createAuditLog({
            userId,
            action: 'auth.logout',
            resourceId: userId,
        });
    }

    /**
     * Change password (authenticated user)
     */
    async changePassword(userId: string, data: ChangePasswordDto): Promise<void> {
        const { currentPassword, newPassword } = data;

        // Validate new password
        const passwordError = validatePasswordStrength(newPassword);
        if (passwordError) {
            throw new BadRequestError(passwordError);
        }

        // Get user
        const user = await authRepository.findUserById(userId);
        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        // Verify current password
        const isPasswordValid = await comparePassword(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestError('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password
        await authRepository.updateUserPassword(userId, hashedPassword);

        // Audit log
        await createAuditLog({
            userId,
            action: 'auth.change_password',
            resourceId: userId,
        });
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, email: string, data: UpdateProfileDto): Promise<any> {
        return updateProfileUsecase(userId, email, data);
    }

    /**
     * Upload avatar
     */
    async uploadAvatar(userId: string, avatarUrl: string): Promise<{ avatarUrl: string }> {
        return uploadAvatarUsecase(userId, avatarUrl);
    }

    /**
     * Verify MFA code (step 2 for MFA-enabled accounts) and issue full auth tokens.
     */
    async verifyMfa(mfaToken: string, code: string): Promise<AuthResponse> {
        let payload: any;
        try {
            payload = verifyMfaToken(mfaToken);
        } catch {
            throw new UnauthorizedError('Invalid or expired MFA token');
        }

        if (!payload || payload.type !== 'mfa' || !payload.userId) {
            throw new UnauthorizedError('Invalid MFA token payload');
        }

        const user = await authRepository.findUserById(payload.userId as string);
        const isActive = user?.status ? String(user.status).toLowerCase() === 'active' : false;
        if (!user || !isActive || !user.mfaEnabled || !user.mfaSecret) {
            throw new UnauthorizedError('User not eligible for MFA login');
        }

        const isValid = verifyMfaCode(user.mfaSecret, code);
        if (!isValid) {
            // Audit failed MFA verification
            await createAuditLog({
                userId: user.id,
                action: 'auth.mfa_failed',
                resourceId: user.id,
            });
            throw new UnauthorizedError('Invalid MFA code');
        }

        const redisOk = await ensureRedisConnected();

        // Generate tokens after successful MFA verification
        const tokens = generateTokens(user.id, user.email, user.role!.name);

        if (redisOk) {
            await storeRefreshJti(user.id, tokens.refreshTokenJti);
        }

        // Update last login
        await authRepository.updateUser(user.id, {
            lastLogin: new Date(),
        });

        // Get permissions
        const userWithPerms = await authRepository.findUserByEmail(user.email);
        const permissions = userWithPerms ? flattenPermissions(userWithPerms as any) : [];

        // Audit successful MFA login
        await createAuditLog({
            userId: user.id,
            action: 'auth.login_mfa',
            resourceId: user.id,
        });

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: mapAuthUser(user as any),
            permissions,
        };
    }

	/**
	 * Start MFA enrollment for the current user
	 */
	async startMfaEnrollment(userId: string): Promise<StartMfaEnrollmentResponse> {
		return startMfaEnrollmentUsecase(userId);
	}

	/**
	 * Confirm MFA enrollment by verifying the first TOTP code
	 */
	async confirmMfaEnrollment(userId: string, code: string, enrollmentToken: string): Promise<void> {
		await confirmMfaEnrollmentUsecase(userId, code, enrollmentToken);
	}

	/**
	 * Disable MFA for the current user. Optionally verifies a TOTP code for extra safety.
	 */
	async disableMfa(userId: string, code?: string): Promise<void> {
		await disableMfaUsecase(userId, code);
	}
}

export const authService = new AuthService();
