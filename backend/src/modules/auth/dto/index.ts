export interface LoginDto {
    email: string;
    password: string;
    organizationId?: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationId?: string;
}

export interface InviteUserDto {
    email: string;
    roleId: string;
    expiresInHours?: number;
}

export interface CompleteInviteDto {
    token: string;
    password: string;
}

export interface PasswordResetRequestDto {
    email: string;
}

export interface PasswordResetDto {
    token: string;
    password: string;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}

export interface RefreshTokenDto {
    refreshToken: string;
}

export interface UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: Date;
    gender?: string;
    maritalStatus?: string;
    emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
    };
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: string;
        avatarUrl?: string | null;
    };
    permissions?: string[];
}
