import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../shared/src/db/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	constructor() {
		super({
			adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
		} as unknown as any);
	}

	async onModuleInit(): Promise<void> {
		await this.$connect();
	}

	enableShutdownHooks(app: INestApplication): void {
		this.$on('beforeExit' as never, () => {
			void app.close();
		});
	}
}
