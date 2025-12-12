import crypto from 'crypto';
import { addHours } from 'date-fns';
import { authRepository } from './auth.repository';
import {
    hashPassword,
    comparePassword,
    generateTokens,
    validatePasswordStrength,
} from '../../shared/utils/auth';
import { sendEmail } from '../../shared/utils/email';
import { createAuditLog } from '../../shared/utils/audit';
import {
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
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
} from './dto';
import jwt from 'jsonwebtoken';

const generateToken = (length = 32) => crypto.randomBytes(length).toString('hex');
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export class AuthService {
    /**
     * Register a new user
     */
    async register(data: RegisterDto): Promise<AuthResponse> {
        const { email, password, firstName, lastName } = data;

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

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role.name);

        // Audit log
        await createAuditLog({
            userId: user.id,
            action: 'auth.register',
            resourceId: user.id,
        });

        return {
            accessToken,
            refreshToken,
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
        const { email, roleId, expiresInHours = 72 } = data;

        // Validate role exists
        const role = await authRepository.findRoleById(roleId);
        if (!role) {
            throw new NotFoundError('Role not found');
        }

        // Check for existing employee
        const employeeForEmail = await authRepository.findEmployeeByEmail(email);

        // Check for existing user
        let user = await authRepository.findUserByEmail(email);

        if (user && user.verified) {
            throw new BadRequestError('User is already active and verified');
        }

        // Create user if doesn't exist
        if (!user) {
            const randomPassword = generateToken(16);
            const hashedRandomPassword = await hashPassword(randomPassword);

            user = await authRepository.createUser({
                email,
                password: hashedRandomPassword,
                role: { connect: { id: roleId } },
                status: 'active',
                verified: false,
                firstName: employeeForEmail?.firstName ?? null,
                lastName: employeeForEmail?.lastName ?? null,
            }) as any;
        } else {
            // Update existing unverified user
            const updateData: any = {};

            if (user.roleId !== roleId) {
                updateData.roleId = roleId;
            }

            if ((!user.firstName && employeeForEmail?.firstName) || (!user.lastName && employeeForEmail?.lastName)) {
                updateData.firstName = user.firstName ?? employeeForEmail?.firstName ?? null;
                updateData.lastName = user.lastName ?? employeeForEmail?.lastName ?? null;
            }

            if (Object.keys(updateData).length > 0) {
                user = await authRepository.updateUser(user.id, updateData) as any;
            }
        }

        // Delete any existing invites
        await authRepository.deleteInvitesByEmail(email);

        // Ensure user is not null before creating invite
        if (!user) {
            throw new Error('User creation failed');
        }

        // Create new invite
        const token = generateToken();
        const tokenHash = hashToken(token);

        const invite = await authRepository.createInvite({
            email,
            role: { connect: { id: roleId } },
            user: { connect: { id: user.id } },
            tokenHash,
            expiresAt: addHours(new Date(), expiresInHours),
        });

        // Link employee to user
        if (employeeForEmail && user) {
            await authRepository.updateEmployeeUserId(email, user.id);
        }

        // Generate invite link
        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/accept-invite?token=${token}`;

        // Send email (fire and forget)
        sendEmail({
            to: email,
            subject: 'You have been invited to NovaHR',
            html: `
        <p>Hello,</p>
        <p>You have been invited to join the HRM system. Click the button below to set your password and activate your account:</p>
        <p><a href="${inviteLink}" style="display:inline-block;padding:8px 16px;border-radius:4px;background:#2563eb;color:#ffffff;text-decoration:none;">Accept invite</a></p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
      `,
        }).catch(err => {
            console.error('Failed to send invite email', err);
        });

        // Audit log
        await createAuditLog({
            userId: invitedBy,
            action: 'auth.invite_user',
            resourceId: user.id,
            newValues: { email, roleId },
        });

        return {
            inviteId: invite.id,
            inviteLink,
        };
    }

    /**
     * Complete invite and activate account
     */
    async completeInvite(data: CompleteInviteDto): Promise<{ userId: string; email: string }> {
        const { token, password } = data;

        // Validate password
        const passwordError = validatePasswordStrength(password);
        if (passwordError) {
            throw new BadRequestError(passwordError);
        }

        // Find invite
        const invite = await authRepository.findInvite(hashToken(token));
        if (!invite) {
            throw new BadRequestError('Invite is invalid or expired');
        }

        // Hash new password
        const hashedPassword = await hashPassword(password);

        // Update user
        let user = invite.user;
        if (user) {
            user = await authRepository.updateUser(user.id, {
                password: hashedPassword,
                role: { connect: { id: invite.roleId } },
                status: 'active',
                verified: true,
            });
        } else {
            // Fallback: create new user
            const defaultRole = await authRepository.findRoleById(invite.roleId);
            user = await authRepository.createUser({
                email: invite.email,
                password: hashedPassword,
                role: { connect: { id: invite.roleId } },
                status: 'active',
                verified: true,
            });
        }

        // Mark invite as accepted
        await authRepository.acceptInvite(invite.id, user.id);

        // Audit log
        await createAuditLog({
            userId: user.id,
            action: 'auth.complete_invite',
            resourceId: user.id,
        });

        return {
            userId: user.id,
            email: user.email,
        };
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(data: PasswordResetRequestDto): Promise<{ resetLink: string }> {
        const { email } = data;

        const user = await authRepository.findUserByEmail(email);
        if (!user) {
            // Return success even if user doesn't exist (security best practice)
            return { resetLink: '' };
        }

        if (!user.verified) {
            throw new BadRequestError('Account is not verified. Please activate your account first.');
        }

        // Generate reset token
        const token = generateToken();
        const tokenHash = hashToken(token);

        await authRepository.createPasswordResetToken({
            user: { connect: { id: user.id } },
            tokenHash,
            expiresAt: addHours(new Date(), 2),
        });

        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

        // Send email (fire and forget)
        sendEmail({
            to: email,
            subject: 'Reset your NovaHR password',
            html: `
        <p>Hello,</p>
        <p>We received a request to reset the password for your HRM account. Click the button below to set a new password:</p>
        <p><a href="${resetLink}" style="display:inline-block;padding:8px 16px;border-radius:4px;background:#2563eb;color:#ffffff;text-decoration:none;">Reset password</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
      `,
        }).catch(err => {
            console.error('Failed to send password reset email', err);
        });

        // Audit log
        await createAuditLog({
            userId: user.id,
            action: 'auth.request_password_reset',
            resourceId: user.id,
        });

        return { resetLink };
    }

    /**
     * Reset password using token
     */
    async resetPassword(data: PasswordResetDto): Promise<void> {
        const { token, password } = data;

        // Validate password
        const passwordError = validatePasswordStrength(password);
        if (passwordError) {
            throw new BadRequestError(passwordError);
        }

        // Find token
        const tokenRecord = await authRepository.findPasswordResetToken(hashToken(token));
        if (!tokenRecord) {
            throw new BadRequestError('Reset token is invalid or expired');
        }

        // Hash new password
        const hashedPassword = await hashPassword(password);

        // Update user password
        await authRepository.updateUserPassword(tokenRecord.userId, hashedPassword);

        // Mark token as used
        await authRepository.markTokenAsUsed(tokenRecord.id);

        // Audit log
        await createAuditLog({
            userId: tokenRecord.userId,
            action: 'auth.reset_password',
            resourceId: tokenRecord.userId,
        });
    }

    /**
     * Login user
     */
    async login(data: LoginDto): Promise<AuthResponse> {
        const { email, password } = data;

        const user = await authRepository.findUserByEmail(email);

        if (!user || user.status !== 'active') {
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

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role.name);

        // Update last login
        await authRepository.updateUser(user.id, {
            lastLogin: new Date(),
        });

        // Flatten permissions
        const permissions = user.role.permissions.map(
            (rp: any) => `${rp.permission.resource}.${rp.permission.action}`
        );

        // Audit successful login
        await createAuditLog({
            userId: user.id,
            action: 'auth.login',
            resourceId: user.id,
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role.name,
                avatarUrl: user.avatarUrl,
            },
            permissions,
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
            payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
        } catch {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }

        // Get user
        const user = await authRepository.findUserByEmail(payload.email);

        if (!user || user.status !== 'active') {
            throw new UnauthorizedError('User not found or inactive');
        }

        // Generate new tokens
        const tokens = generateTokens(user.id, user.email, user.role!.name);

        // Get permissions
        const userWithPerms = await authRepository.findUserByEmail(user.email);
        const permissions = userWithPerms?.role.permissions.map(
            (rp: any) => `${rp.permission.resource}.${rp.permission.action}`
        ) || [];

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role!.name,
                avatarUrl: user.avatarUrl,
            },
            permissions,
        };
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
        const { firstName, lastName, ...employeeData } = data;

        // Update user basic info
        if (firstName || lastName) {
            await authRepository.updateUser(userId, {
                firstName: firstName || undefined,
                lastName: lastName || undefined,
            });
        }

        // Get current user for fallback values
        const currentUser = await authRepository.findUserById(userId);
        if (!currentUser) {
            throw new UnauthorizedError('User not found');
        }

        const finalFirstName = firstName || currentUser.firstName || '';
        const finalLastName = lastName || currentUser.lastName || '';

        // Normalize emergency contact
        const normalizedEmergencyContact =
            data.emergencyContact &&
                (data.emergencyContact.name || data.emergencyContact.relationship || data.emergencyContact.phone)
                ? data.emergencyContact
                : null;

        // Upsert employee record
        const employee = await authRepository.upsertEmployee(userId, {
            userId,
            email,
            firstName: finalFirstName,
            lastName: finalLastName,
            employeeNumber: `EMP-${Date.now()}`,
            hireDate: new Date(),
            salary: 0,
            phoneNumber: data.phoneNumber,
            address: data.address,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            gender: data.gender,
            maritalStatus: data.maritalStatus,
            emergencyContact: normalizedEmergencyContact,
        });

        return {
            user: {
                firstName: finalFirstName,
                lastName: finalLastName,
            },
            employee,
        };
    }

    /**
     * Upload avatar
     */
    async uploadAvatar(userId: string, avatarUrl: string): Promise<{ avatarUrl: string }> {
        await authRepository.updateUser(userId, {
            avatarUrl,
        });

        return { avatarUrl };
    }
}

export const authService = new AuthService();
