import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { getAppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = getAppConfig();

  // Security middleware
  app.use(helmet());

  // CORS configuration (GDPR compliant - EU-only domains)
  app.enableCors({
    origin: appConfig.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Rate limiting for auth endpoints
  // TODO: Implement proper rate limiting middleware

  const port = appConfig.port;
  await app.listen(port);
  console.log(`✓ Health Platform API running on http://localhost:${port}`);
  console.log(`✓ Environment: ${appConfig.nodeEnv}`);
  console.log(`✓ Data Residency: ${appConfig.dataResidencyCountry}`);
  console.log(`✓ DPO Contact: ${appConfig.dpoEmail}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
