import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    OneToOne,
} from 'typeorm';
import { UserRole, Gender } from '../dtos/auth.dto';
import { Patient } from './patient.entity';

@Entity('users')
@Index(['email'])
@Index(['role'])
@Index(['deletedAt'])
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255 })
    passwordHash: string;

    @Column({ type: 'enum', enum: UserRole })
    role: UserRole;

    @Column({ type: 'varchar', length: 255 })
    firstName: string;

    @Column({ type: 'varchar', length: 255 })
    lastName: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    phone: string;

    @Column({ type: 'date', nullable: true })
    dateOfBirth: Date;

    @Column({ type: 'enum', enum: Gender, nullable: true })
    gender: Gender;

    @Column({ type: 'bytea', nullable: true })
    addressEncrypted: Buffer;

    @Column({ type: 'varchar', length: 255, nullable: true })
    addressIv: string;

    // MFA
    @Column({ type: 'varchar', length: 255, nullable: true })
    mfaSecret: string;

    @Column({ type: 'boolean', default: false })
    mfaEnabled: boolean;

    // DPA & Consent
    @Column({ type: 'uuid', nullable: true })
    currentConsentVersionId: string;

    @Column({ type: 'timestamp', nullable: true })
    consentSignedAt: Date;

    // Session & Activity
    @Column({ type: 'timestamp', nullable: true })
    lastLoginAt: Date;

    @Column({ type: 'inet', nullable: true })
    lastLoginIp: string;

    @Column({ type: 'varchar', length: 128, nullable: true })
    refreshTokenHash: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    deletedAt: Date;

    // Relations
    @OneToOne(() => Patient, (patient) => patient.user, { nullable: true })
    patient: Patient;
}
