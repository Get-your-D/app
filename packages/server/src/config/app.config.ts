export interface AppConfig {
    port: number;
    nodeEnv: string;
    corsOrigin: string[];
    jwtSecret: string;
    jwtExpiration: string;
    jwtRefreshExpiration: string;
    dpoEmail: string;
    companyName: string;
    dataResidencyCountry: string;
}

export const getAppConfig = (): AppConfig => ({
    port: parseInt(process.env.PORT || '3003', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    jwtExpiration: process.env.JWT_EXPIRATION || '15m',
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    dpoEmail: process.env.DPO_EMAIL || 'dpo@yourcompany.de',
    companyName: process.env.COMPANY_NAME || 'Your Healthcare Company',
    dataResidencyCountry: process.env.DATA_RESIDENCY_COUNTRY || 'DE',
});
