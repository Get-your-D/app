import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule);
	app.enableCors({ origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'] });
	const prisma = app.get(PrismaService);
	prisma.enableShutdownHooks(app);
	await app.listen(process.env.PORT ?? 3003);
}
void bootstrap();
