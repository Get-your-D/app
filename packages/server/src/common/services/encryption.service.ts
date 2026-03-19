import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * GDPR & TISAX compliant encryption service
 * Uses AES-256-GCM for authenticated encryption
 */
@Injectable()
export class EncryptionService {
    private algorithm = 'aes-256-gcm';
    private keyDerivationIterations = 100000; // PBKDF2

    /**
     * Encrypt data using AES-256-GCM
     * @param plaintext The data to encrypt
     * @param masterKey The encryption key (should come from KMS in production)
     * @returns Encrypted data in format: iv:encrypted:authTag
     */
    encrypt(plaintext: string, masterKey: string): { encrypted: string; iv: string } {
        if (!plaintext || !masterKey) {
            throw new Error('Plaintext and master key are required');
        }

        // Generate random IV
        const iv = crypto.randomBytes(16);

        // Derive key from master key
        const key = crypto.scryptSync(masterKey, 'salt', 32);

        // Create cipher
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);

        // Encrypt
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get auth tag
        const authTag = (cipher as any).getAuthTag();

        return {
            encrypted: `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`,
            iv: iv.toString('hex'),
        };
    }

    /**
     * Decrypt data using AES-256-GCM
     * @param encryptedData Data in format: iv:encrypted:authTag
     * @param masterKey The encryption key
     * @returns Decrypted plaintext
     */
    decrypt(encryptedData: string, masterKey: string): string {
        if (!encryptedData || !masterKey) {
            throw new Error('Encrypted data and master key are required');
        }

        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const authTag = Buffer.from(parts[2], 'hex');

        // Derive key from master key
        const key = crypto.scryptSync(masterKey, 'salt', 32);

        // Create decipher
        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
        (decipher as any).setAuthTag(authTag);

        // Decrypt
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Hash password using argon2-like approach (using crypto.scryptSync)
     * For production, use argon2 library
     */
    hashPassword(password: string): string {
        const salt = crypto.randomBytes(32);
        const hash = crypto.scryptSync(password, salt, 64);
        return `${salt.toString('hex')}:${hash.toString('hex')}`;
    }

    /**
     * Verify password hash
     */
    verifyPassword(password: string, hash: string): boolean {
        const parts = hash.split(':');
        const salt = Buffer.from(parts[0], 'hex');
        const storedHash = parts[1];
        const computed = crypto.scryptSync(password, salt, 64);
        return computed.toString('hex') === storedHash;
    }

    /**
     * Generate SHA-256 hash for document versioning
     */
    hashDocument(content: string): string {
        return crypto.createHash('sha256').update(content).digest('hex');
    }
}
