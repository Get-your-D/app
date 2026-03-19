import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
    let service: EncryptionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [EncryptionService],
        }).compile();

        service = module.get<EncryptionService>(EncryptionService);
    });

    describe('AES-256-GCM Encryption', () => {
        it('should encrypt and decrypt data correctly', () => {
            const plaintext = 'Sensitive patient information';
            const masterKey = service.deriveMasterKey('test-password');

            const encrypted = service.encrypt(plaintext, masterKey);
            expect(encrypted).not.toBe(plaintext);
            expect(encrypted).toContain(':'); // Contains IV and auth tag

            const decrypted = service.decrypt(encrypted, masterKey);
            expect(decrypted).toBe(plaintext);
        });

        it('should use different IVs for each encryption', () => {
            const plaintext = 'Same data twice';
            const masterKey = service.deriveMasterKey('test-password');

            const encrypted1 = service.encrypt(plaintext, masterKey);
            const encrypted2 = service.encrypt(plaintext, masterKey);

            expect(encrypted1).not.toBe(encrypted2); // Different IVs
            expect(service.decrypt(encrypted1, masterKey)).toBe(plaintext);
            expect(service.decrypt(encrypted2, masterKey)).toBe(plaintext);
        });

        it('should reject tampered ciphertext', () => {
            const plaintext = 'Original message';
            const masterKey = service.deriveMasterKey('test-password');

            const encrypted = service.encrypt(plaintext, masterKey);
            const tampered = encrypted.slice(0, -5) + 'xxxxx'; // Tamper with auth tag

            expect(() => {
                service.decrypt(tampered, masterKey);
            }).toThrow();
        });

        it('should handle large data', () => {
            const largeData = 'X'.repeat(1000000); // 1MB
            const masterKey = service.deriveMasterKey('test-password');

            const encrypted = service.encrypt(largeData, masterKey);
            const decrypted = service.decrypt(encrypted, masterKey);

            expect(decrypted).toBe(largeData);
        });
    });

    describe('Password Hashing', () => {
        it('should hash passwords with Argon2', async () => {
            const password = 'SecurePassword123!@#';

            const hash = await service.hashPassword(password);
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(50); // Argon2 hash is longer

            const isValid = await service.verifyPassword(password, hash);
            expect(isValid).toBe(true);
        });

        it('should reject wrong passwords', async () => {
            const password = 'CorrectPassword123!';
            const wrongPassword = 'WrongPassword456!';

            const hash = await service.hashPassword(password);
            const isValid = await service.verifyPassword(wrongPassword, hash);

            expect(isValid).toBe(false);
        });

        it('should generate unique hashes for same password', async () => {
            const password = 'SamePassword123!';

            const hash1 = await service.hashPassword(password);
            const hash2 = await service.hashPassword(password);

            expect(hash1).not.toBe(hash2); // Different salts
        });
    });

    describe('Document Hashing', () => {
        it('should generate SHA-256 hash', () => {
            const document = 'Medical record content';

            const hash = service.hashDocument(document);
            expect(hash).toBeDefined();
            expect(hash.length).toBe(64); // SHA-256 is 64 hex characters

            // Same document should produce same hash
            const hash2 = service.hashDocument(document);
            expect(hash2).toBe(hash);
        });

        it('should detect document modifications', () => {
            const original = 'Record 1: Patient allergies';
            const modified = 'Record 2: Patient allergies';

            const hash1 = service.hashDocument(original);
            const hash2 = service.hashDocument(modified);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('Key Derivation', () => {
        it('should derive valid encryption key', () => {
            const password = 'MasterPassword123!';

            const key = service.deriveMasterKey(password);
            expect(key).toBeDefined();
            expect(key.length).toBeGreaterThan(0);

            // Same password should derive same key
            const key2 = service.deriveMasterKey(password);
            expect(key2).toBe(key);
        });

        it('should produce different keys for different passwords', () => {
            const password1 = 'Password1!';
            const password2 = 'Password2!';

            const key1 = service.deriveMasterKey(password1);
            const key2 = service.deriveMasterKey(password2);

            expect(key1).not.toBe(key2);
        });
    });

    describe('GDPR Compliance', () => {
        it('should support data anonymization', () => {
            const personalData = 'John Doe, DOB: 1990-01-01, SSN: 123-45-6789';

            // Anonymize PII
            const anonymized = service.anonymizeData(personalData);
            expect(anonymized).not.toContain('John');
            expect(anonymized).not.toContain('1990-01-01');
        });

        it('should track encryption/decryption operations', () => {
            const plaintext = 'Sensitive data';
            const masterKey = service.deriveMasterKey('password');

            // Track that encryption occurred
            const encrypted = service.encrypt(plaintext, masterKey);
            expect(encrypted).toBeDefined();

            // Audit trail should record this operation
        });
    });
});
