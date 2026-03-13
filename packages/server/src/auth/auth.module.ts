import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../entities/user.entity';
import { ConsentVersion } from '../entities/consent-version.entity';
import { ConsentRecord } from '../entities/consent-record.entity';
import { AuditService } from '../common/services/audit.service';
import { AuditLog } from '../entities/audit-log.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRATION || '15m',
      },
    }),
    TypeOrmModule.forFeature([User, ConsentVersion, ConsentRecord, AuditLog]),
  ],
  providers: [AuthService, JwtStrategy, AuditService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
