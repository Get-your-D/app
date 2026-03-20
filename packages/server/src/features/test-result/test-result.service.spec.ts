// Mock the Prisma client before any imports — client.ts uses import.meta (ESM)
// which is incompatible with Jest's CommonJS transform.
jest.mock('shared/db/generated/prisma/client', () => ({
	PrismaClient: jest.fn().mockImplementation(() => ({})),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConsentService } from '../consent/consent.service';
import { TestResultService, CreateTestResultInput } from './test-result.service';
import { TestResultRepository } from './test-result.repository';

const mockRepo = {
	findManyByPatientId: jest.fn(),
	findById: jest.fn(),
	create: jest.fn(),
	delete: jest.fn(),
};

const mockConsentService = {
	checkConsentForClinicAndResult: jest.fn(),
};

const mockTestResult = {
	id: 'test-id',
	patientId: 'patient-id',
	type: 'VITAMIN_D' as const,
	value: '50',
	testedAt: new Date(),
	createdAt: new Date(),
	testedById: null,
	deletedAt: null,
};

describe('TestResultService', () => {
	let service: TestResultService;

	beforeEach(async () => {
		jest.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TestResultService,
				{ provide: TestResultRepository, useValue: mockRepo },
				{ provide: ConsentService, useValue: mockConsentService },
			],
		}).compile();

		service = module.get<TestResultService>(TestResultService);
	});

	describe('findAll', () => {
		it('should return all test results for a patient', async () => {
			mockRepo.findManyByPatientId.mockResolvedValue([mockTestResult]);
			const results = await service.findAll('patient-id');
			expect(results).toEqual([mockTestResult]);
			expect(mockRepo.findManyByPatientId).toHaveBeenCalledWith('patient-id');
		});
	});

	describe('findAllForClinic', () => {
		it('should return only consent-approved results', async () => {
			mockRepo.findManyByPatientId.mockResolvedValue([mockTestResult]);
			mockConsentService.checkConsentForClinicAndResult.mockResolvedValue(true);
			const results = await service.findAllForClinic('clinic-id', 'patient-id');
			expect(results).toEqual([mockTestResult]);
		});

		it('should filter out results without consent', async () => {
			mockRepo.findManyByPatientId.mockResolvedValue([mockTestResult]);
			mockConsentService.checkConsentForClinicAndResult.mockResolvedValue(false);
			const results = await service.findAllForClinic('clinic-id', 'patient-id');
			expect(results).toEqual([]);
		});
	});

	describe('findById', () => {
		it('should return the test result when found', async () => {
			mockRepo.findById.mockResolvedValue(mockTestResult);
			const result = await service.findById('test-id');
			expect(result).toEqual(mockTestResult);
		});

		it('should throw NotFoundException when not found', async () => {
			mockRepo.findById.mockResolvedValue(null);
			await expect(service.findById('missing-id')).rejects.toThrow(NotFoundException);
		});
	});

	describe('create', () => {
		it('should create and return a test result', async () => {
			mockRepo.create.mockResolvedValue(mockTestResult);
			const input: CreateTestResultInput = {
				patientId: 'patient-id',
				type: 'VITAMIN_D',
				value: '50',
				testedAt: new Date(),
			};
			const result = await service.create(input);
			expect(result).toEqual(mockTestResult);
			expect(mockRepo.create).toHaveBeenCalledWith(input);
		});
	});

	describe('delete', () => {
		it('should soft-delete and return the test result', async () => {
			mockRepo.delete.mockResolvedValue(mockTestResult);
			const result = await service.delete('test-id');
			expect(result).toEqual(mockTestResult);
		});
	});
});
