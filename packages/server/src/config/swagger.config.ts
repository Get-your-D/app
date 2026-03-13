import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle('Healthcare Platform API')
        .setDescription(
            'GDPR-compliant healthcare management system with patient records, appointments, and consent tracking',
        )
        .setVersion('1.0.0')
        .setContact({
            name: 'Data Protection Officer',
            email: process.env.DPO_EMAIL || 'dpo@healthcare.com',
        })
        .setLicense(
            'Proprietary',
            'Licensed under EU GDPR and German medical data protection regulations',
        )
        .addServer(process.env.API_URL || 'http://localhost:3001', 'Development Server')
        .addServer(process.env.PROD_API_URL || 'https://api.healthcare.com', 'Production Server')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT access token (expires in 15 minutes)',
            },
            'access-token',
        )
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Refresh token (expires in 7 days)',
            },
            'refresh-token',
        )
        .addApiKey(
            {
                type: 'apiKey',
                name: 'X-MFA-Token',
                in: 'header',
                description: 'MFA verification token (required after login)',
            },
            'mfa-token',
        )
        .addTag(
            'Authentication',
            'User registration, login, MFA setup, token management, DPA consent tracking',
        )
        .addTag('Patient Records', 'CRUD operations on clinical records with AES-256 encryption')
        .addTag('Appointments', 'Appointment scheduling, consent recording, telemedicine management')
        .addTag('Dashboard', 'Role-based metrics (admin, provider, patient, compliance)')
        .addTag('Compliance', 'GDPR requests (access, export, deletion), audit logs, breach notifications')
        .addTag('Health', 'Service health and readiness checks')
        .build();

    const document = SwaggerModule.createDocument(app, config, {
        deepScanRoutes: true,
        ignoreGlobalPrefix: false,
    });

    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            displayOperationId: true,
            tryItOutEnabled: true,
            filter: true,
            showRequestHeaders: true,
            requestSnippetsEnabled: true,
        },
        customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .auth-btn { background-color: #ff6b6b; }
    `,
    });

    const redocUrl = 'api/redoc';
    SwaggerModule.setup(redocUrl, app, document, {
        url: '/api/swagger-json',
        customCss: '.redoc-container { font-family: sans-serif; }',
    });

    console.log('✓ Swagger documentation available at /api/docs');
    console.log('✓ ReDoc documentation available at /api/redoc');
}
