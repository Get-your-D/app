import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function prismaClientOptions(): Prisma.PrismaClientOptions {
	return {
		adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
	};
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	constructor() {
		super(prismaClientOptions());
	}

	async onModuleInit(): Promise<void> {
		await this.$connect();
	}

	enableShutdownHooks(app: INestApplication): void {
		const shutdown = (): void => {
			void app.close();
		};

		process.on('SIGINT', shutdown);
		process.on('SIGTERM', shutdown);
	}
}
