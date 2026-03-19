import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { User } from '../entities/user.entity';
import { consentVersion } from '../utils/consent.template';
import { AuditService } from '../common/services/audit.service';
import { RegisterDto, LoginDto, UserRole, MfaResponseDto, RefreshTokenDto } from '../common/dtos/auth.dto';
import { ConsentVersion } from '../entities/consent-version.entity';
import { ConsentRecord, ConsentAction } from '../entities/consent-record.entity';
import { AuditAction } from '../entities/audit-log.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(ConsentVersion)
        private consentVersionRepository: Repository<ConsentVersion>,
        @InjectRepository(ConsentRecord)
        private consentRecordRepository: Repository<ConsentRecord>,
        private jwtService: JwtService,
        private auditService: AuditService,
    ) { }

    async register(dto: RegisterDto, ipAddress: string) {
        // Validate email uniqueness
        const existingUser = await this.usersRepository.findOne({ where: { email: dto.email } });
        if (existingUser) {
            await this.auditService.log({
                action: AuditAction.REGISTER,
                resourceType: 'user',
                status: 'failure',
                description: `Registration attempt with existing email: ${dto.email}`,
                ipAddress,
            });
            throw new BadRequestException('Email already registered');
        }

        // Hash password using argon2 (NIST approved)
        const passwordHash = await argon2.hash(dto.password, {
            memoryCost: 65540,
            timeCost: 3,
            parallelism: 4,
        });

        // Create user
        const userObj = {
            email: dto.email,
            passwordHash,
            role: dto.role,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : new Date(),
            gender: dto.gender,
        };

        const user = this.usersRepository.create(userObj) as User;

        try {
            const savedUser = await this.usersRepository.save(user);

            // Log audit trail
            await this.auditService.log({
                userId: savedUser.id,
                action: AuditAction.REGISTER,
                resourceType: 'user',
                resourceId: savedUser.id,
                status: 'success',
                ipAddress,
            });

            // Get latest DPA version and create consent
            const latestDpa = await this.consentVersionRepository.findOne({
                where: { active: true },
                order: { effectiveDate: 'DESC' },
            });

            if (latestDpa) {
                await this.consentRecordRepository.save({
                    userId: savedUser.id,
                    action: ConsentAction.GENERAL_DPA,
                    granted: true,
                    consentVersionHash: latestDpa.hash,
                    ipAddress,
                });

                savedUser.currentConsentVersionId = latestDpa.id;
                savedUser.consentSignedAt = new Date();
            }

            return {
                id: savedUser.id,
                email: savedUser.email,
                role: savedUser.role,
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                mfaRequired: savedUser.role === UserRole.PROVIDER, // Providers must enable MFA
            };
        } catch (error) {
            await this.auditService.log({
                action: AuditAction.REGISTER,
                resourceType: 'user',
                status: 'failure',
                description: `Registration failed: ${error.message}`,
                ipAddress,
            });
            throw new InternalServerErrorException('Failed to create user');
        }
    }

    async login(dto: LoginDto, ipAddress: string) {
        const user = await this.usersRepository.findOne({ where: { email: dto.email } });

        if (!user) {
            await this.auditService.log({
                action: AuditAction.LOGIN_FAILED,
                resourceType: 'user',
                status: 'failure',
                description: `Login attempt with non-existent email: ${dto.email}`,
                ipAddress,
            });
            throw new UnauthorizedException('Invalid email or password');
        }

        // Verify password
        const passwordValid = await argon2.verify(user.passwordHash, dto.password);
        if (!passwordValid) {
            await this.auditService.log({
                userId: user.id,
                action: AuditAction.LOGIN_FAILED,
                resourceType: 'user',
                resourceId: user.id,
                status: 'failure',
                description: 'Invalid password',
                ipAddress,
            });
            throw new UnauthorizedException('Invalid email or password');
        }

        // Check MFA if enabled
        if (user.mfaEnabled) {
            if (!dto.totpToken) {
                throw new UnauthorizedException('MFA token required');
            }

            const validTotp = speakeasy.totp.verify({
                secret: user.mfaSecret,
                encoding: 'base32',
                token: dto.totpToken,
                window: 2, // Allow 2 time windows
            });

            if (!validTotp) {
                await this.auditService.log({
                    userId: user.id,
                    action: AuditAction.LOGIN_FAILED,
                    resourceType: 'user',
                    resourceId: user.id,
                    status: 'failure',
                    description: 'Invalid MFA token',
                    ipAddress,
                });
                throw new UnauthorizedException('Invalid MFA token');
            }
        }

        // Generate tokens
        const tokens = await this.generateTokens(user);
        user.lastLoginAt = new Date();
        user.lastLoginIp = ipAddress;

        // Hash refresh token for security
        user.refreshTokenHash = await argon2.hash(tokens.refreshToken);
        await this.usersRepository.save(user);

        // Log successful login
        await this.auditService.log({
            userId: user.id,
            action: AuditAction.LOGIN_SUCCESS,
            resourceType: 'user',
            resourceId: user.id,
            status: 'success',
            ipAddress,
        });

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        };
    }

    async setupMfa(userId: string): Promise<MfaResponseDto> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `HealthPlatform (${user.email})`,
            issuer: 'HealthPlatform',
            length: 32,
        });

        // Generate QR code
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);

        return {
            secret: secret.base32,
            qrCode,
            requiresVerification: true,
        };
    }

    async confirmMfa(userId: string, token: string, secret: string): Promise<void> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const validTotp = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2,
        });

        if (!validTotp) {
            throw new BadRequestException('Invalid token');
        }

        user.mfaSecret = secret;
        user.mfaEnabled = true;
        await this.usersRepository.save(user);

        await this.auditService.log({
            userId,
            action: AuditAction.MFA_ENABLED,
            resourceType: 'user',
            resourceId: userId,
            status: 'success',
        });
    }

    async refresh(dto: RefreshTokenDto, userId: string): Promise<{ accessToken: string }> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Verify refresh token hash
        const refreshTokenValid = await argon2.verify(user.refreshTokenHash || '', dto.refreshToken);
        if (!refreshTokenValid) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Generate new access token
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: process.env.JWT_EXPIRATION || '15m',
        });

        return { accessToken };
    }

    async logout(userId: string): Promise<void> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (user) {
            (user as any).refreshTokenHash = null;
            await this.usersRepository.save(user);
        }

        await this.auditService.log({
            userId,
            action: AuditAction.LOGOUT,
            resourceType: 'user',
            resourceId: userId,
            status: 'success',
        });
    }

    async getCurrentUser(userId: string) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            select: ['id', 'email', 'firstName', 'lastName', 'role', 'phone', 'createdAt'],
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return user;
    }

    private async generateTokens(user: User) {
        const payload = { sub: user.id, email: user.email, role: user.role };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: process.env.JWT_EXPIRATION || '15m',
        });

        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
        });

        return { accessToken, refreshToken };
    }
}
