import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';

export interface AuditLogEntry {
    userId?: string;
    action: AuditAction;
    resourceType: string;
    resourceId?: string;
    status?: 'success' | 'failure';
    ipAddress?: string;
    changes?: Record<string, any>;
    description?: string;
}

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) { }

    async log(entry: AuditLogEntry): Promise<AuditLog> {
        const auditLog = this.auditLogRepository.create({
            userId: entry.userId,
            action: entry.action,
            resourceType: entry.resourceType,
            resourceId: entry.resourceId,
            status: entry.status || 'success',
            ipAddress: entry.ipAddress,
            changes: entry.changes,
            description: entry.description,
            createdAt: new Date(),
        });

        const savedLog = await this.auditLogRepository.save(auditLog);

        // TODO: Archive to S3 WORM bucket for compliance (immutable storage)
        // await this.s3Service.archiveAuditLog(savedLog);

        return savedLog;
    }

    async getAuditTrail(
        resourceType: string,
        resourceId: string,
        limit: number = 50,
        offset: number = 0,
    ) {
        return await this.auditLogRepository.find({
            where: { resourceType, resourceId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    async getUserAuditTrail(
        userId: string,
        limit: number = 50,
        offset: number = 0,
    ) {
        return await this.auditLogRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    async getSuspiciousActivity(hours: number = 24) {
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);
        return await this.auditLogRepository.find({
            where: [
                { action: AuditAction.LOGIN_FAILED, createdAt: { '>': since } as any },
                { action: AuditAction.SECURITY_BREACH_DETECTED, createdAt: { '>': since } as any },
            ],
            order: { createdAt: 'DESC' },
        });
    }
}
