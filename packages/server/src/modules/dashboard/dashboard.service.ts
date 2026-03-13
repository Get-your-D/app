import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../entities/patient.entity';
import { Appointment, AppointmentStatus } from '../../entities/appointment.entity';
import { User } from '../../entities/user.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { ConsentRecord } from '../../entities/consent-record.entity';

/**
 * GDPR-compliant dashboard metrics service
 * Returns only aggregated, anonymized data
 */
@Injectable()
export class DashboardMetricsService {
    constructor(
        @InjectRepository(Patient)
        private patientsRepository: Repository<Patient>,
        @InjectRepository(Appointment)
        private appointmentsRepository: Repository<Appointment>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
        @InjectRepository(ConsentRecord)
        private consentRecordRepository: Repository<ConsentRecord>,
    ) { }

    /**
     * Admin dashboard metrics
     * Returns anonymized aggregated data only
     */
    async getAdminMetrics(userId: string, userRole: string) {
        if (userRole !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }

        // NO individual patient names or IDs - only counts
        const totalPatients = await this.patientsRepository.count({
            where: { deletedAt: null },
        });

        const totalProviders = await this.usersRepository.count({
            where: { role: 'provider', deletedAt: null },
        });

        // Appointments this week (aggregated)
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const appointmentsThisWeek = await this.appointmentsRepository.count({
            where: {
                scheduledTime: weekStart,
                status: AppointmentStatus.SCHEDULED,
            },
        });

        // Compliance metrics
        const consentSignatureRate = await this.getConsentSignatureRate();
        const auditLogCount = await this.auditLogRepository.count();

        // Security metrics
        const loginFailuresLast24h = await this.auditLogRepository.count({
            where: {
                action: AuditAction.LOGIN_FAILED,
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
        });

        return {
            metrics: {
                totalPatients,
                totalProviders,
                appointmentsThisWeek,
                auditLogsRecorded: auditLogCount,
            },
            compliance: {
                consentSignatureRate: `${consentSignatureRate}%`,
            },
            security: {
                failedLoginsLast24h: loginFailuresLast24h,
            },
        };
    }

    /**
     * Provider dashboard metrics
     * Returns only their own appointment and patient counts
     */
    async getProviderMetrics(providerId: string, userRole: string) {
        if (userRole !== 'provider') {
            throw new ForbiddenException('Provider access required');
        }

        const appointmentsScheduled = await this.appointmentsRepository.count({
            where: {
                providerId,
                status: AppointmentStatus.SCHEDULED,
            },
        });

        const appointmentsCompleted = await this.appointmentsRepository.count({
            where: {
                providerId,
                status: AppointmentStatus.COMPLETED,
            },
        });

        // Upcoming appointments
        const upcomingAppointments = await this.appointmentsRepository.find({
            where: {
                providerId,
                status: AppointmentStatus.SCHEDULED,
            },
            order: { scheduledTime: 'ASC' },
            take: 5,
        });

        return {
            appointmentsScheduled,
            appointmentsCompleted,
            upcomingAppointments: upcomingAppointments.map((a) => ({
                id: a.id,
                scheduledTime: a.scheduledTime,
                title: a.title,
                patientConsentRecorded: a.patientConsentRecorded,
            })),
        };
    }

    /**
     * Patient dashboard metrics
     * Returns only anonymized data about own appointments
     */
    async getPatientMetrics(patientId: string, userRole: string) {
        if (userRole !== 'patient') {
            throw new ForbiddenException('Patient access required');
        }

        const upcomingAppointments = await this.appointmentsRepository.find({
            where: {
                patientId,
                status: AppointmentStatus.SCHEDULED,
            },
            order: { scheduledTime: 'ASC' },
            take: 5,
            relations: ['provider'],
        });

        const pastAppointments = await this.appointmentsRepository.count({
            where: {
                patientId,
                status: AppointmentStatus.COMPLETED,
            },
        });

        return {
            upcomingAppointments: upcomingAppointments.map((a) => ({
                id: a.id,
                title: a.title,
                scheduledTime: a.scheduledTime,
                appointmentType: a.appointmentType,
                providerName: a.provider?.firstName + ' ' + a.provider?.lastName,
            })),
            pastAppointmentCount: pastAppointments,
        };
    }

    /**
     * Compliance dashboard metrics
     * Admin-only, aggregated GDPR compliance data
     */
    async getComplianceMetrics(userId: string, userRole: string) {
        if (userRole !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }

        const totalAuditLogs = await this.auditLogRepository.count();

        const auditLogsByAction = await this.auditLogRepository
            .createQueryBuilder('log')
            .select('log.action', 'action')
            .addSelect('COUNT(*)', 'count')
            .groupBy('log.action')
            .getRawMany();

        const dataExportRequests = await this.auditLogRepository.count({
            where: { action: AuditAction.DATA_EXPORT },
        });

        const accountDeletionRequests = await this.auditLogRepository.count({
            where: { action: AuditAction.ACCOUNT_DELETION_REQUESTED },
        });

        const breachDetections = await this.auditLogRepository.count({
            where: { action: AuditAction.SECURITY_BREACH_DETECTED },
        });

        return {
            auditTrail: {
                totalLogs: totalAuditLogs,
                byAction: auditLogsByAction,
            },
            gdprRequests: {
                dataExports: dataExportRequests,
                accountDeletions: accountDeletionRequests,
            },
            security: {
                breachesDetected: breachDetections,
            },
        };
    }

    private async getConsentSignatureRate(): Promise<number> {
        const totalPatients = await this.patientsRepository.count({
            where: { deletedAt: null },
        });

        const patientsWithConsent = await this.patientsRepository.count({
            where: {
                deletedAt: null,
                consentSignedAt: undefined, // Has signed consent
            },
        });

        if (totalPatients === 0) return 0;
        return Math.round((patientsWithConsent / totalPatients) * 100);
    }
}
