// Mock the Prisma client before any imports — client.ts uses import.meta (ESM)
// which is incompatible with Jest's CommonJS transform.
jest.mock('shared/db/generated/prisma/client', () => ({
	PrismaClient: jest.fn().mockImplementation(() => ({})),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { ConsentRepository } from './consent.repository';

const mockRepo = {
	createRequest: jest.fn(),
	findRequestById: jest.fn(),
	findRequestsByPatientId: jest.fn(),
	findRequestsByClinicId: jest.fn(),
	updateRequestStatus: jest.fn(),
	createConsent: jest.fn(),
	findConsentById: jest.fn(),
	findConsentsByPatientId: jest.fn(),
	findActiveConsentForClinicAndResult: jest.fn(),
	findActiveConsentsForClinicAndPatient: jest.fn(),
	revokeConsent: jest.fn(),
};

const now = new Date();
const future = new Date(now.getTime() + 60_000);

const pendingRequest = {
	id: 'req-1',
	patientId: 'patient-1',
	clinicId: 'clinic-1',
	testResultId: 'result-1',
	type: 'SPECIFIC' as const,
	status: 'PENDING' as const,
	requestedAt: now,
	expiresAt: future,
};

const mockConsent = {
	id: 'consent-1',
	patientId: 'patient-1',
	clinicId: 'clinic-1',
	testResultId: 'result-1',
	consentRequestId: 'req-1',
	resultStartAt: null,
	resultEndAt: null,
	grantedAt: now,
	expiresAt: null,
	revokedAt: null,
};

describe('ConsentService', () => {
	let service: ConsentService;

	beforeEach(async () => {
		jest.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			providers: [ConsentService, { provide: ConsentRepository, useValue: mockRepo }],
		}).compile();

		service = module.get<ConsentService>(ConsentService);
	});

	describe('createRequest', () => {
		it('should throw BadRequestException when SPECIFIC type missing testResultId', async () => {
			await expect(service.createRequest({ patientId: 'p', clinicId: 'c', type: 'SPECIFIC' })).rejects.toThrow(
				BadRequestException,
			);
			expect(mockRepo.createRequest).not.toHaveBeenCalled();
		});

		it('should create a SPECIFIC request with testResultId', async () => {
			mockRepo.createRequest.mockResolvedValue(pendingRequest);
			const result = await service.createRequest({
				patientId: 'patient-1',
				clinicId: 'clinic-1',
				type: 'SPECIFIC',
				testResultId: 'result-1',
			});
			expect(result).toEqual(pendingRequest);
			expect(mockRepo.createRequest).toHaveBeenCalledWith(
				expect.objectContaining({ status: 'PENDING', type: 'SPECIFIC', testResultId: 'result-1' }),
			);
		});

		it('should create an ALL request without testResultId', async () => {
			const allRequest = { ...pendingRequest, type: 'ALL' as const, testResultId: null };
			mockRepo.createRequest.mockResolvedValue(allRequest);
			const result = await service.createRequest({ patientId: 'patient-1', clinicId: 'clinic-1', type: 'ALL' });
			expect(result).toEqual(allRequest);
		});
	});

	describe('approveRequest', () => {
		it('should throw NotFoundException when request not found', async () => {
			mockRepo.findRequestById.mockResolvedValue(null);
			await expect(service.approveRequest('missing', {})).rejects.toThrow(NotFoundException);
		});

		it('should throw BadRequestException when request is not PENDING', async () => {
			mockRepo.findRequestById.mockResolvedValue({ ...pendingRequest, status: 'APPROVED' });
			await expect(service.approveRequest('req-1', {})).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException when request is expired', async () => {
			const expired = { ...pendingRequest, expiresAt: new Date(now.getTime() - 1000) };
			mockRepo.findRequestById.mockResolvedValue(expired);
			await expect(service.approveRequest('req-1', {})).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException when resultStartAt > resultEndAt', async () => {
			mockRepo.findRequestById.mockResolvedValue(pendingRequest);
			const start = new Date('2026-02-01');
			const end = new Date('2026-01-01');
			await expect(service.approveRequest('req-1', { resultStartAt: start, resultEndAt: end })).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should approve and return both consentRequest and consent', async () => {
			mockRepo.findRequestById.mockResolvedValue(pendingRequest);
			const approved = { ...pendingRequest, status: 'APPROVED' as const };
			mockRepo.updateRequestStatus.mockResolvedValue(approved);
			mockRepo.createConsent.mockResolvedValue(mockConsent);

			const result = await service.approveRequest('req-1', {});
			expect(result.consentRequest).toEqual(approved);
			expect(result.consent).toEqual(mockConsent);
			expect(mockRepo.updateRequestStatus).toHaveBeenCalledWith('req-1', 'APPROVED');
		});
	});

	describe('rejectRequest', () => {
		it('should throw NotFoundException when request not found', async () => {
			mockRepo.findRequestById.mockResolvedValue(null);
			await expect(service.rejectRequest('missing')).rejects.toThrow(NotFoundException);
		});

		it('should throw BadRequestException when request is not PENDING', async () => {
			mockRepo.findRequestById.mockResolvedValue({ ...pendingRequest, status: 'REJECTED' });
			await expect(service.rejectRequest('req-1')).rejects.toThrow(BadRequestException);
		});

		it('should reject a PENDING request', async () => {
			mockRepo.findRequestById.mockResolvedValue(pendingRequest);
			const rejected = { ...pendingRequest, status: 'REJECTED' as const };
			mockRepo.updateRequestStatus.mockResolvedValue(rejected);
			const result = await service.rejectRequest('req-1');
			expect(result).toEqual(rejected);
			expect(mockRepo.updateRequestStatus).toHaveBeenCalledWith('req-1', 'REJECTED');
		});
	});

	describe('revokeConsent', () => {
		it('should throw NotFoundException when consent not found', async () => {
			mockRepo.findConsentById.mockResolvedValue(null);
			await expect(service.revokeConsent('missing')).rejects.toThrow(NotFoundException);
		});

		it('should throw BadRequestException when already revoked', async () => {
			mockRepo.findConsentById.mockResolvedValue({ ...mockConsent, revokedAt: now });
			await expect(service.revokeConsent('consent-1')).rejects.toThrow(BadRequestException);
		});

		it('should revoke and return the consent', async () => {
			mockRepo.findConsentById.mockResolvedValue(mockConsent);
			const revoked = { ...mockConsent, revokedAt: now };
			mockRepo.revokeConsent.mockResolvedValue(revoked);
			const result = await service.revokeConsent('consent-1');
			expect(result).toEqual(revoked);
		});
	});

	describe('checkConsentForClinicAndResult', () => {
		const testResult = { id: 'result-1', patientId: 'patient-1', testedAt: new Date('2026-01-15') };

		it('should return true when SPECIFIC consent exists', async () => {
			mockRepo.findActiveConsentForClinicAndResult.mockResolvedValue(mockConsent);
			const result = await service.checkConsentForClinicAndResult('clinic-1', testResult);
			expect(result).toBe(true);
		});

		it('should return true when ALL consent covers testedAt date', async () => {
			mockRepo.findActiveConsentForClinicAndResult.mockResolvedValue(null);
			mockRepo.findActiveConsentsForClinicAndPatient.mockResolvedValue([
				{
					...mockConsent,
					testResultId: null,
					resultStartAt: new Date('2026-01-01'),
					resultEndAt: new Date('2026-01-31'),
				},
			]);
			const result = await service.checkConsentForClinicAndResult('clinic-1', testResult);
			expect(result).toBe(true);
		});

		it('should return false when ALL consent date range excludes testedAt', async () => {
			mockRepo.findActiveConsentForClinicAndResult.mockResolvedValue(null);
			mockRepo.findActiveConsentsForClinicAndPatient.mockResolvedValue([
				{
					...mockConsent,
					testResultId: null,
					resultStartAt: new Date('2026-02-01'),
					resultEndAt: new Date('2026-02-28'),
				},
			]);
			const result = await service.checkConsentForClinicAndResult('clinic-1', testResult);
			expect(result).toBe(false);
		});

		it('should return false when no consent exists', async () => {
			mockRepo.findActiveConsentForClinicAndResult.mockResolvedValue(null);
			mockRepo.findActiveConsentsForClinicAndPatient.mockResolvedValue([]);
			const result = await service.checkConsentForClinicAndResult('clinic-1', testResult);
			expect(result).toBe(false);
		});
	});
});
