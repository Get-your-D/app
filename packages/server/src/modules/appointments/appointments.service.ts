import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus, AppointmentType } from '../../entities/appointment.entity';
import { ConsentRecord, ConsentAction } from '../../entities/consent-record.entity';
import { Patient } from '../../entities/patient.entity';
import { AuditService } from '../../common/services/audit.service';
import { AuditAction } from '../../entities/audit-log.entity';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private appointmentsRepository: Repository<Appointment>,
        @InjectRepository(ConsentRecord)
        private consentRecordRepository: Repository<ConsentRecord>,
        @InjectRepository(Patient)
        private patientsRepository: Repository<Patient>,
        private auditService: AuditService,
    ) { }

    async createAppointment(
        patientId: string,
        providerId: string,
        appointmentData: {
            appointmentType: AppointmentType;
            scheduledTime: Date;
            title: string;
            durationMinutes?: number;
            description?: string;
        },
    ) {
        const patient = await this.patientsRepository.findOne({ where: { id: patientId } });
        if (!patient) {
            throw new NotFoundException('Patient not found');
        }

        // Validate appointment time (must be in future)
        if (new Date(appointmentData.scheduledTime) <= new Date()) {
            throw new BadRequestException('Appointment must be scheduled for future date');
        }

        const appointment = this.appointmentsRepository.create({
            patientId,
            providerId,
            appointmentType: appointmentData.appointmentType,
            scheduledTime: new Date(appointmentData.scheduledTime),
            title: appointmentData.title,
            description: appointmentData.description,
            durationMinutes: appointmentData.durationMinutes || 30,
            status: AppointmentStatus.SCHEDULED,
        });

        const savedAppointment = await this.appointmentsRepository.save(appointment);

        await this.auditService.log({
            userId: providerId,
            action: AuditAction.CREATE_APPOINTMENT,
            resourceType: 'appointment',
            resourceId: savedAppointment.id,
            status: 'success',
        });

        // TODO: Send notification to patient

        return savedAppointment;
    }

    async getAppointment(appointmentId: string, userId: string, userRole: string) {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id: appointmentId },
            relations: ['patient', 'provider'],
        });

        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        // GDPR: Enforce access control
        if (userRole === 'patient' && appointment.patientId !== userId) {
            throw new ForbiddenException('Cannot access other patient appointments');
        }
        if (userRole === 'provider' && appointment.providerId !== userId) {
            throw new ForbiddenException('Cannot access appointments for other patients');
        }

        return appointment;
    }

    async listAppointments(
        userId: string,
        userRole: string,
        filters?: {
            patientId?: string;
            providerId?: string;
            status?: AppointmentStatus;
        },
    ) {
        let query = this.appointmentsRepository.createQueryBuilder('appointment');

        if (userRole === 'patient') {
            query = query.where('appointment.patientId = :userId', { userId });
        } else if (userRole === 'provider') {
            query = query.where('appointment.providerId = :userId', { userId });
        }

        if (filters?.patientId) {
            query = query.andWhere('appointment.patientId = :patientId', { patientId: filters.patientId });
        }

        if (filters?.status) {
            query = query.andWhere('appointment.status = :status', { status: filters.status });
        }

        const appointments = await query.orderBy('appointment.scheduledTime', 'ASC').getMany();

        return appointments;
    }

    async recordAppointmentConsent(
        appointmentId: string,
        patientId: string,
        consentData: {
            recordingConsent: boolean;
        },
        ipAddress: string,
    ) {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id: appointmentId },
        });

        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        if (appointment.patientId !== patientId) {
            throw new ForbiddenException('Cannot provide consent for other patient appointments');
        }

        // Record appointment consent
        await this.consentRecordRepository.save({
            appointmentId,
            userId: patientId,
            action: ConsentAction.APPOINTMENT_CONSENT,
            granted: true,
            ipAddress,
        });

        // Record recording consent if applicable (for telemedicine)
        if (appointment.appointmentType === AppointmentType.TELEMEDICINE) {
            await this.consentRecordRepository.save({
                appointmentId,
                userId: patientId,
                action: ConsentAction.RECORDING_CONSENT,
                granted: consentData.recordingConsent,
                ipAddress,
            });
        }

        appointment.patientConsentRecorded = true;
        appointment.recordingConsent = consentData.recordingConsent;
        await this.appointmentsRepository.save(appointment);

        await this.auditService.log({
            userId: patientId,
            action: AuditAction.CONSENT_SIGNED,
            resourceType: 'appointment',
            resourceId: appointmentId,
            status: 'success',
            description: `Recording consent: ${consentData.recordingConsent}`,
        });

        return { message: 'Consent recorded successfully' };
    }

    async completeAppointment(appointmentId: string, providerId: string) {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id: appointmentId },
        });

        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        if (appointment.providerId !== providerId) {
            throw new ForbiddenException('Cannot complete appointments for other providers');
        }

        appointment.status = AppointmentStatus.COMPLETED;
        appointment.completedAt = new Date();
        await this.appointmentsRepository.save(appointment);

        await this.auditService.log({
            userId: providerId,
            action: AuditAction.UPDATE_APPOINTMENT,
            resourceType: 'appointment',
            resourceId: appointmentId,
            status: 'success',
        });

        return appointment;
    }

    async cancelAppointment(appointmentId: string, userId: string, userRole: string) {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id: appointmentId },
        });

        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        // Can only cancel own appointments or as provider
        if (
            (userRole === 'patient' && appointment.patientId !== userId) ||
            (userRole === 'provider' && appointment.providerId !== userId)
        ) {
            throw new ForbiddenException('Cannot cancel this appointment');
        }

        appointment.status = AppointmentStatus.CANCELLED;
        await this.appointmentsRepository.save(appointment);

        await this.auditService.log({
            userId,
            action: AuditAction.CANCEL_APPOINTMENT,
            resourceType: 'appointment',
            resourceId: appointmentId,
            status: 'success',
        });

        // TODO: Send cancellation notification

        return { message: 'Appointment cancelled successfully' };
    }
}
