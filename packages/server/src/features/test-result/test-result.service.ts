import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { TestResult, TestResultType } from 'shared/db/generated/prisma/client';
import { ConsentService } from '../consent/consent.service';
import { TestResultRepository } from './test-result.repository';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

export type CreateTestResultInput = {
	patientId: string;
	type: TestResultType;
	value: string;
	testedAt: Date | string;
	testedById?: string;
};

export type UpdateTestResultInput = Partial<Omit<CreateTestResultInput, 'patientId'>>;

@Injectable()
export class TestResultService {
	constructor(
		private readonly repo: TestResultRepository,
		private readonly consentService: ConsentService,
	) {}

	findAll(patientId: string): Promise<TestResult[]> {
		return this.repo.findManyByPatientId(patientId);
	}

	async findAllForClinic(clinicId: string, patientId: string): Promise<TestResult[]> {
		const results = await this.repo.findManyByPatientId(patientId);
		const filtered: TestResult[] = [];
		for (const result of results) {
			const hasConsent = await this.consentService.checkConsentForClinicAndResult(clinicId, {
				id: result.id,
				patientId: result.patientId,
				testedAt: result.testedAt,
			});
			if (hasConsent) {
				filtered.push(result);
			}
		}
		return filtered;
	}

	async findById(id: string): Promise<TestResult> {
		const result = await this.repo.findById(id);
		if (!result) {
			throw new NotFoundException(`TestResult with id ${id} not found`);
		}
		return result;
	}

	create(input: CreateTestResultInput): Promise<TestResult> {
		return this.repo.create(input);
	}

	delete(id: string): Promise<TestResult> {
		try {
			return this.repo.delete(id);
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
				throw new NotFoundException(`TestResult with id ${id} not found`);
			}
			throw new InternalServerErrorException('Failed to delete TestResult');
		}
	}
}
