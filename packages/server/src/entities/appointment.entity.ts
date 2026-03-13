import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Patient } from './patient.entity';
import { User } from './user.entity';
import { ConsentRecord } from './consent-record.entity';

export enum AppointmentStatus {
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    NO_SHOW = 'no_show',
}

export enum AppointmentType {
    TELEMEDICINE = 'telemedicine',
    IN_PERSON = 'in_person',
}

@Entity('appointments')
@Index(['patientId', 'scheduledTime'])
@Index(['providerId', 'scheduledTime'])
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    patientId: string;

    @Column({ type: 'uuid' })
    providerId: string;

    @Column({ type: 'enum', enum: AppointmentType })
    appointmentType: AppointmentType;

    @Column({ type: 'timestamp' })
    scheduledTime: Date;

    @Column({ type: 'int', default: 30 })
    durationMinutes: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
    status: AppointmentStatus;

    @Column({ type: 'boolean', default: false })
    patientConsentRecorded: boolean;

    @Column({ type: 'boolean', default: false })
    recordingConsent: boolean;

    @Column({ type: 'text', nullable: true })
    recordingUrlEncrypted: string; // Encrypted S3 URL

    @Column({ type: 'varchar', length: 255, nullable: true })
    recordingUrlIv: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    completedAt: Date;

    // Relations
    @ManyToOne(() => Patient, (patient) => patient.appointments)
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'providerId' })
    provider: User;

    @OneToMany(() => ConsentRecord, (consent) => consent.appointment)
    consents: ConsentRecord[];
}
