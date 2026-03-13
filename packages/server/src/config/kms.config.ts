export interface KmsConfig {
    region: string;
    keyId: string;
    enabled: boolean;
}

export const getKmsConfig = (): KmsConfig => ({
    region: process.env.KMS_REGION || 'eu-central-1',
    keyId: process.env.KMS_KEY_ID || process.env.ENCRYPTION_KEY_ID || 'local-dev-key',
    enabled: process.env.NODE_ENV === 'production',
});
