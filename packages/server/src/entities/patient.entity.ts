import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { ClinicalRecord } from './clinical-record.entity';
import { Appointment } from './appointment.entity';

@Entity('patients')
@Index(['medicalRecordNumber'])
@Index(['userId'])
export class Patient {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unique: true })
    userId: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    medicalRecordNumber: string;

    @Column({ type: 'bytea', nullable: true })
    allergiesEncrypted: Buffer;

    @Column({ type: 'varchar', length: 255, nullable: true })
    allergiesIv: string;

    @Column({ type: 'bytea', nullable: true })
    chronicConditionsEncrypted: Buffer;

    @Column({ type: 'varchar', length: 255, nullable: true })
    chronicConditionsIv: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    emergencyContactName: string;

    @Column({ type: 'bytea', nullable: true })
    emergencyContactPhoneEncrypted: Buffer;

    @Column({ type: 'varchar', length: 255, nullable: true })
    emergencyContactPhoneIv: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    insuranceProvider: string;

    @Column({ type: 'bytea', nullable: true })
    insuranceNumberEncrypted: Buffer;

    @Column({ type: 'varchar', length: 255, nullable: true })
    insuranceNumberIv: string;

    @Column({ type: 'uuid', nullable: true })
    consentVersionId: string;

    @Column({ type: 'timestamp', nullable: true })
    consentSignedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    deletedAt: Date;

    // Relations
    @OneToOne(() => User, (user) => user.patient)
    @JoinColumn({ name: 'userId' })
    user: User;

    @OneToMany(() => ClinicalRecord, (record) => record.patient)
    clinicalRecords: ClinicalRecord[];

    @OneToMany(() => Appointment, (appointment) => appointment.patient)
    appointments: Appointment[];
}
