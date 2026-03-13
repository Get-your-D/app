import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { setupServer } from './config/server-setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  await setupServer(app);

  const port = process.env.PORT || 3001;

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    new Logger('Bootstrap').log('SIGTERM received, gracefully shutting down...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    new Logger('Bootstrap').log('SIGINT received, gracefully shutting down...');
    await app.close();
    process.exit(0);
  });

  await app.listen(port);
}

bootstrap()
  .then(() => {
    new Logger('Bootstrap').log('Application started successfully');
  })
  .catch((error) => {
    new Logger('Bootstrap').error('Failed to start application:', error);
    process.exit(1);
  });
