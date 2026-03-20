import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Consent, ConsentRequest, ConsentRequestType } from 'shared/db/generated/prisma/client';
import { ConsentRepository } from './consent.repository';

export type CreateConsentRequestInput = {
	patientId: string;
	clinicId: string;
	type: ConsentRequestType;
	testResultId?: string;
};

export type ApproveConsentRequestInput = {
	resultStartAt?: Date;
	resultEndAt?: Date;
};

export type ApproveConsentRequestResult = {
	consentRequest: ConsentRequest;
	consent: Consent;
};

@Injectable()
export class ConsentService {
	constructor(private readonly repo: ConsentRepository) {}

	async createRequest(input: CreateConsentRequestInput): Promise<ConsentRequest> {
		if (input.type === 'SPECIFIC' && !input.testResultId) {
			throw new BadRequestException('testResultId is required for SPECIFIC consent requests');
		}

		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 30);

		return this.repo.createRequest({
			patientId: input.patientId,
			clinicId: input.clinicId,
			type: input.type,
			testResultId: input.testResultId,
			expiresAt,
			status: 'PENDING',
		});
	}

	async approveRequest(id: string, input: ApproveConsentRequestInput): Promise<ApproveConsentRequestResult> {
		const request = await this.repo.findRequestById(id);
		if (!request) {
			throw new NotFoundException(`ConsentRequest with id ${id} not found`);
		}
		if (request.status !== 'PENDING') {
			throw new BadRequestException(`ConsentRequest is not in PENDING status`);
		}
		if (request.expiresAt < new Date()) {
			throw new BadRequestException(`ConsentRequest has expired`);
		}
		if (input.resultStartAt && input.resultEndAt && input.resultStartAt > input.resultEndAt) {
			throw new BadRequestException('resultStartAt must be before or equal to resultEndAt');
		}

		const consentRequest = await this.repo.updateRequestStatus(id, 'APPROVED');
		const consent = await this.repo.createConsent({
			patientId: request.patientId,
			clinicId: request.clinicId,
			testResultId: request.testResultId ?? undefined,
			consentRequestId: id,
			resultStartAt: input.resultStartAt,
			resultEndAt: input.resultEndAt,
		});

		return { consentRequest, consent };
	}

	async rejectRequest(id: string): Promise<ConsentRequest> {
		const request = await this.repo.findRequestById(id);
		if (!request) {
			throw new NotFoundException(`ConsentRequest with id ${id} not found`);
		}
		if (request.status !== 'PENDING') {
			throw new BadRequestException(`ConsentRequest is not in PENDING status`);
		}
		return this.repo.updateRequestStatus(id, 'REJECTED');
	}

	async revokeConsent(consentId: string): Promise<Consent> {
		const consent = await this.repo.findConsentById(consentId);
		if (!consent) {
			throw new NotFoundException(`Consent with id ${consentId} not found`);
		}
		if (consent.revokedAt) {
			throw new BadRequestException(`Consent has already been revoked`);
		}
		return this.repo.revokeConsent(consentId);
	}

	async getRequestsForPatient(patientId: string): Promise<ConsentRequest[]> {
		const requests = await this.repo.findRequestsByPatientId(patientId);
		return this.expireStaleRequests(requests);
	}

	async getRequestsForClinic(clinicId: string): Promise<ConsentRequest[]> {
		const requests = await this.repo.findRequestsByClinicId(clinicId);
		return this.expireStaleRequests(requests);
	}

	async getConsentsForPatient(patientId: string): Promise<Consent[]> {
		return this.repo.findConsentsByPatientId(patientId);
	}

	findRequestById(id: string): Promise<ConsentRequest | null> {
		return this.repo.findRequestById(id);
	}

	findConsentById(id: string): Promise<Consent | null> {
		return this.repo.findConsentById(id);
	}

	async checkConsentForClinicAndResult(
		clinicId: string,
		testResult: { id: string; patientId: string; testedAt: Date },
	): Promise<boolean> {
		// 1. Check active SPECIFIC consent
		const specificConsent = await this.repo.findActiveConsentForClinicAndResult(clinicId, testResult.id);
		if (specificConsent) {
			return true;
		}

		// 2. Check active ALL consents with optional date range filter
		const allConsents = await this.repo.findActiveConsentsForClinicAndPatient(clinicId, testResult.patientId);
		for (const consent of allConsents) {
			if (consent.resultStartAt && testResult.testedAt < consent.resultStartAt) {
				continue;
			}
			if (consent.resultEndAt && testResult.testedAt > consent.resultEndAt) {
				continue;
			}
			return true;
		}

		return false;
	}

	private async expireStaleRequests(requests: ConsentRequest[]): Promise<ConsentRequest[]> {
		const now = new Date();
		const results: ConsentRequest[] = [];

		for (const request of requests) {
			if (request.status === 'PENDING' && request.expiresAt < now) {
				const expired = await this.repo.updateRequestStatus(request.id, 'EXPIRED');
				results.push(expired);
			} else {
				results.push(request);
			}
		}

		return results;
	}
}
