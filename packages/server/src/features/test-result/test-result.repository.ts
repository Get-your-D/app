import { Injectable } from '@nestjs/common';
import { Prisma, TestResult } from 'shared/db/generated/prisma/client';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class TestResultRepository {
	constructor(private readonly db: DatabaseService) {}

	findManyByPatientId(patientId: string): Promise<TestResult[]> {
		return this.db.testResult.findMany({
			where: { patientId, deletedAt: null },
		});
	}

	findManyByClinicId(clinicId: string): Promise<TestResult[]> {
		return this.db.testResult.findMany({
			where: { testedById: clinicId, deletedAt: null },
		});
	}

	findById(id: string): Promise<TestResult | null> {
		return this.db.testResult.findUnique({ where: { id } });
	}

	create(data: Prisma.TestResultUncheckedCreateInput): Promise<TestResult> {
		return this.db.testResult.create({ data });
	}

	delete(id: string): Promise<TestResult> {
		return this.db.testResult.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	}
}
