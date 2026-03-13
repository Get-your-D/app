import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

export enum AuditAction {
    REGISTER = 'REGISTER',
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    LOGIN_FAILED = 'LOGIN_FAILED',
    LOGOUT = 'LOGOUT',
    CREATE_PATIENT = 'CREATE_PATIENT',
    READ_RECORD = 'READ_RECORD',
    CREATE_RECORD = 'CREATE_RECORD',
    UPDATE_RECORD = 'UPDATE_RECORD',
    DELETE_RECORD = 'DELETE_RECORD',
    CREATE_APPOINTMENT = 'CREATE_APPOINTMENT',
    UPDATE_APPOINTMENT = 'UPDATE_APPOINTMENT',
    CANCEL_APPOINTMENT = 'CANCEL_APPOINTMENT',
    CONSENT_SIGNED = 'CONSENT_SIGNED',
    CONSENT_WITHDRAWN = 'CONSENT_WITHDRAWN',
    DATA_EXPORT = 'DATA_EXPORT',
    ACCOUNT_DELETION_REQUESTED = 'ACCOUNT_DELETION_REQUESTED',
    PASSWORD_RESET = 'PASSWORD_RESET',
    MFA_ENABLED = 'MFA_ENABLED',
    MFA_DISABLED = 'MFA_DISABLED',
    SECURITY_BREACH_DETECTED = 'SECURITY_BREACH_DETECTED',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['resourceType', 'resourceId'])
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true })
    userId: string;

    @Column({ type: 'enum', enum: AuditAction })
    action: AuditAction;

    @Column({ type: 'varchar', length: 50 })
    resourceType: string;

    @Column({ type: 'uuid', nullable: true })
    resourceId: string;

    @Column({ type: 'enum', enum: ['success', 'failure'], default: 'success' })
    status: 'success' | 'failure';

    @Column({ type: 'inet', nullable: true })
    ipAddress: string;

    @Column({ type: 'jsonb', nullable: true })
    changes: Record<string, any>;

    @Column({ type: 'text', nullable: true })
    description: string;

    @CreateDateColumn()
    createdAt: Date;
}
