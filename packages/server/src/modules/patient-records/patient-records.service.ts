import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../entities/patient.entity';
import { ClinicalRecord, RecordType } from '../../entities/clinical-record.entity';
import { User } from '../../entities/user.entity';
import { EncryptionService } from '../../common/services/encryption.service';
import { AuditService } from '../../common/services/audit.service';
import { AuditAction } from '../../entities/audit-log.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PatientRecordsService {
    constructor(
        @InjectRepository(Patient)
        private patientsRepository: Repository<Patient>,
        @InjectRepository(ClinicalRecord)
        private recordsRepository: Repository<ClinicalRecord>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private encryptionService: EncryptionService,
        private auditService: AuditService,
    ) { }

    async createPatient(patientData: any, providerId: string) {
        const medicalRecordNumber = `MRN-${Date.now()}-${uuidv4().slice(0, 8)}`;

        const patient = this.patientsRepository.create({
            ...patientData,
            medicalRecordNumber,
        });

        const savedPatient = await this.patientsRepository.save(patient);

        await this.auditService.log({
            userId: providerId,
            action: AuditAction.CREATE_PATIENT,
            resourceType: 'patient',
            resourceId: (savedPatient as any).id,
            status: 'success',
        });

        return savedPatient;
    }

    async getPatientById(patientId: string, userId: string, userRole: string) {
        const patient = await this.patientsRepository.findOne({
            where: { id: patientId },
            relations: ['user'],
        });

        if (!patient) {
            throw new NotFoundException('Patient not found');
        }

        // GDPR: Patients can only see own data, providers can only see assigned patients
        if (userRole === 'patient' && patient.userId !== userId) {
            throw new ForbiddenException('Cannot access other patient data');
        }

        // TODO: Check provider-patient assignment for providers

        await this.auditService.log({
            userId,
            action: AuditAction.READ_RECORD,
            resourceType: 'patient',
            resourceId: patientId,
            status: 'success',
        });

        return patient;
    }

    async createClinicalRecord(
        patientId: string,
        providerId: string,
        recordData: {
            recordType: RecordType;
            title: string;
            content: string;
        },
    ) {
        const patient = await this.patientsRepository.findOne({ where: { id: patientId } });
        if (!patient) {
            throw new NotFoundException('Patient not found');
        }

        // Encrypt content (GDPR Article 32 - Encryption at rest)
        const encryptionKey = this.getEncryptionKeyForPatient(patientId);
        const { encrypted, iv } = this.encryptionService.encrypt(
            recordData.content,
            encryptionKey,
        );

        const record = this.recordsRepository.create({
            patientId,
            providerId,
            recordType: recordData.recordType,
            title: recordData.title,
            contentEncrypted: Buffer.from(encrypted),
            contentIv: iv,
        });

        const savedRecord = await this.recordsRepository.save(record);

        await this.auditService.log({
            userId: providerId,
            action: AuditAction.CREATE_RECORD,
            resourceType: 'clinical_record',
            resourceId: savedRecord.id,
            status: 'success',
        });

        return { id: savedRecord.id, title: savedRecord.title };
    }

    async getPatientRecords(patientId: string, userId: string, userRole: string) {
        // Check access
        if (userRole === 'patient' && patientId !== userId) {
            throw new ForbiddenException('Cannot access other patient records');
        }

        const records = await this.recordsRepository.find({
            where: { patientId, deletedAt: undefined as any },
            order: { createdAt: 'DESC' },
        });

        // Decrypt records (GDPR Article 15 - Right to access)
        const encryptionKey = this.getEncryptionKeyForPatient(patientId);
        const decryptedRecords = records.map((record) => {
            const contentEncrypted = `${record.contentIv}:${record.contentEncrypted.toString('hex')}:${record.contentIv}`;
            const content = this.encryptionService.decrypt(contentEncrypted, encryptionKey);
            return {
                ...record,
                content,
            };
        });

        await this.auditService.log({
            userId,
            action: AuditAction.READ_RECORD,
            resourceType: 'clinical_records',
            resourceId: patientId,
            status: 'success',
        });

        return decryptedRecords;
    }

    async deleteRecord(recordId: string, userId: string) {
        const record = await this.recordsRepository.findOne({ where: { id: recordId } });
        if (!record) {
            throw new NotFoundException('Record not found');
        }

        // Soft delete (GDPR - maintain audit trail)
        record.deletedAt = new Date();
        await this.recordsRepository.save(record);

        await this.auditService.log({
            userId,
            action: AuditAction.DELETE_RECORD,
            resourceType: 'clinical_record',
            resourceId: recordId,
            status: 'success',
        });

        return { message: 'Record deleted successfully' };
    }

    async exportPatientData(patientId: string, userId: string): Promise<any> {
        // GDPR Article 20 - Right to data portability
        if (patientId !== userId) {
            throw new ForbiddenException('Can only export own data');
        }

        const patient = await this.patientsRepository.findOne({
            where: { id: patientId },
            relations: ['clinicalRecords', 'appointments'],
        });

        if (!patient) {
            throw new NotFoundException('Patient not found');
        }

        const encryptionKey = this.getEncryptionKeyForPatient(patientId);
        const decryptedRecords = patient.clinicalRecords.map((record) => ({
            ...record,
            content: this.encryptionService.decrypt(
                `${record.contentIv}:${record.contentEncrypted.toString('hex')}:${record.contentIv}`,
                encryptionKey,
            ),
        }));

        await this.auditService.log({
            userId,
            action: AuditAction.DATA_EXPORT,
            resourceType: 'patient',
            resourceId: patientId,
            status: 'success',
        });

        return {
            patient: {
                id: patient.id,
                medicalRecordNumber: patient.medicalRecordNumber,
                createdAt: patient.createdAt,
            },
            records: decryptedRecords,
            appointments: patient.appointments,
        };
    }

    private getEncryptionKeyForPatient(patientId: string): string {
        // In production, retrieve from AWS KMS or HashiCorp Vault
        // For now, use patient ID as part of the key
        return `patient-key-${patientId}-${process.env.ENCRYPTION_KEY_ID || 'dev-key'}`;
    }
}
