import { AWS } from 'aws-sdk';

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

// Initialize AWS SDK
if (process.env.NODE_ENV === 'production') {
    AWS.config.update({
        region: process.env.AWS_REGION || 'eu-central-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
}
