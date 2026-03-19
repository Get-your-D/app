import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum UserRole {
    PATIENT = 'patient',
    PROVIDER = 'provider',
    ADMIN = 'admin',
}

export enum Gender {
    MALE = 'M',
    FEMALE = 'F',
    OTHER = 'O',
    NOTSPECIFIED = 'N',
}

// Auth DTOs
export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(12)
    @MaxLength(128)
    password: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsEnum(UserRole)
    role: UserRole;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    dateOfBirth?: string; // ISO string for patients

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    totpToken?: string; // For MFA
}

export class RefreshTokenDto {
    @IsString()
    refreshToken: string;
}

export class PasswordResetRequestDto {
    @IsEmail()
    email: string;
}

export class PasswordResetDto {
    @IsString()
    token: string;

    @IsString()
    @MinLength(12)
    newPassword: string;
}

// Auth Response
export class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
    };
}

export class MfaResponseDto {
    secret: string;
    qrCode: string;
    requiresVerification: boolean;
}
