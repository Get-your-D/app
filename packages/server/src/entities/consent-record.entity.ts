import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { User } from './user.entity';

export enum ConsentAction {
    APPOINTMENT_CONSENT = 'appointment_consent',
    RECORDING_CONSENT = 'recording_consent',
    DATA_SHARING = 'data_sharing',
    GENERAL_DPA = 'general_dpa',
}

@Entity('consent_records')
@Index(['userId', 'createdAt'])
@Index(['appointmentId'])
export class ConsentRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true })
    appointmentId: string;

    @Column({ type: 'uuid' })
    userId: string;

    @Column({ type: 'enum', enum: ConsentAction })
    action: ConsentAction;

    @Column({ type: 'boolean' })
    granted: boolean;

    @Column({ type: 'varchar', length: 64, nullable: true })
    consentVersionHash: string;

    @Column({ type: 'inet', nullable: true })
    ipAddress: string;

    @CreateDateColumn()
    signedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    withdrawnAt: Date;

    // Relations
    @ManyToOne(() => Appointment, (appointment) => appointment.consents, { nullable: true })
    @JoinColumn({ name: 'appointmentId' })
    appointment: Appointment;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;
}
