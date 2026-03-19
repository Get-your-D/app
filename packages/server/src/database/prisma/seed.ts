import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main(): Promise<void> {
	const prisma = new PrismaClient({
		adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
	} satisfies Prisma.PrismaClientOptions);

	const email = `demo.patient+${Date.now()}@example.com`;
	const accountId = randomUUID();

	const patient = await prisma.patient.create({
		data: {
			account: {
				create: {
					id: accountId,
					email,
					type: 'PATIENT',
				},
			},
			firstName: 'Demo',
			lastName: 'Patient',
			dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
			weightKg: 72,
			targetVitaminDNgMl: 35,
		},
		select: { id: true, accountId: true },
	});

	await prisma.testResult.create({
		data: {
			patientId: patient.id,
			type: 'VITAMIN_D',
			value: '18',
			testedAt: new Date(),
		},
	});

	console.log('\nSeeded demo patient for Vitamin D recommendation:\n');
	console.log(`patientId: ${patient.id}`);
	console.log('Open web-patient and paste this Patient ID, then click "Load latest".\n');

	await prisma.$disconnect();
}

void main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
