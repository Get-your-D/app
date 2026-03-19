import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Patient } from './patient.entity';
import { User } from './user.entity';

export enum RecordType {
    MEDICATION = 'medication',
    DIAGNOSIS = 'diagnosis',
    LAB_RESULT = 'lab_result',
    NOTE = 'note',
    PRESCRIPTION = 'prescription',
}

@Entity('clinical_records')
@Index(['patientId', 'createdAt'])
@Index(['providerId'])
export class ClinicalRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    patientId: string;

    @Column({ type: 'uuid' })
    providerId: string; // User ID of the provider who created/modified

    @Column({ type: 'enum', enum: RecordType })
    recordType: RecordType;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'bytea' })
    contentEncrypted: Buffer;

    @Column({ type: 'varchar', length: 255, nullable: true })
    contentIv: string;

    @Column({ type: 'text', nullable: true })
    attachmentUrls: string; // JSON array of encrypted S3 URLs

    @Column({ type: 'varchar', length: 64, nullable: true })
    signatureHash: string; // EdDSA signature hash

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    deletedAt: Date;

    // Relations
    @ManyToOne(() => Patient, (patient) => patient.clinicalRecords)
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'providerId' })
    provider: User;
}
