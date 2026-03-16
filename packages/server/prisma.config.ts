import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
	schema: './src/database/prisma/',
	migrations: {
		path: './src/database/prisma/migrations',
	},
	datasource: {
		url: process.env['DATABASE_URL'],
	},
});
