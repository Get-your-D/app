import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('consent_versions')
export class ConsentVersion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'varchar', length: 64 })
    hash: string; // SHA-256 hash for verification

    @Column({ type: 'varchar', length: 32, default: '1.0' })
    version: string;

    @CreateDateColumn()
    effectiveDate: Date;

    @Column({ type: 'boolean', default: true })
    active: boolean;
}
