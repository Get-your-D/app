import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as helmet from 'helmet';
import { apiLimiter, authLimiter } from './common/middleware/rate-limit.middleware';
import { setupSwagger } from './config/swagger.config';

export async function setupServer(app: INestApplication): Promise<void> {
    // Security
    app.use(helmet.default());
    app.use(helmet.contentSecurityPolicy());
    app.use(helmet.crossOriginEmbedderPolicy());
    app.use(helmet.crossOriginOpenerPolicy());
    app.use(helmet.crossOriginResourcePolicy());
    app.use(helmet.dnsPrefetchControl());
    app.use(helmet.frameguard());
    app.use(helmet.hidePoweredBy());
    app.use(helmet.hsts());
    app.use(helmet.ieNoOpen());
    app.use(helmet.noSniff());
    app.use(helmet.permittedCrossDomainPolicies());
    app.use(helmet.referrerPolicy());
    app.use(helmet.xssFilter());

    // CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-MFA-Token'],
        exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
        maxAge: 3600,
    });

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // Validation pipes
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableCircularCheck: true,
            },
        }),
    );

    // Rate limiting
    app.use('/api/v1/auth', authLimiter);
    app.use('/api/v1', apiLimiter);

    // Swagger
    setupSwagger(app);

    // Startup logging
    const port = process.env.PORT || 3001;
    const env = process.env.NODE_ENV || 'development';
    const dpoEmail = process.env.DPO_EMAIL || 'dpo@healthcare.com';
    const dataResidency = process.env.DATA_RESIDENCY_COUNTRY || 'DE';

    console.log(`
╔════════════════════════════════════════════════════╗
║     Healthcare Platform - NestJS Backend v1.0      ║
╠════════════════════════════════════════════════════╣
║ Environment: ${env.toUpperCase().padEnd(41)} ║
║ Port: ${port.toString().padEnd(45)} ║
║ Data Residency: ${dataResidency.padEnd(40)} ║
║ DPO Email: ${dpoEmail.padEnd(45)} ║
║ GDPR Compliance: ✓ ENABLED                         ║
║ Encryption: ✓ AES-256-GCM                          ║
║ Audit Logging: ✓ ENABLED                           ║
║ Rate Limiting: ✓ ENABLED                           ║
║ API Docs: http://localhost:${port}/api/docs         ${' '.repeat(
        port.toString().length === 4 ? 0 : 1,
    )}║
╚════════════════════════════════════════════════════╝
  `);
}
