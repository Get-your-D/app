import { Injectable } from '@nestjs/common';
import { Consent, ConsentRequest, ConsentRequestStatus, Prisma } from 'shared/db/generated/prisma/client';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class ConsentRepository {
	constructor(private readonly db: DatabaseService) {}

	createRequest(data: Prisma.ConsentRequestUncheckedCreateInput): Promise<ConsentRequest> {
		return this.db.consentRequest.create({ data });
	}

	findRequestById(id: string): Promise<ConsentRequest | null> {
		return this.db.consentRequest.findUnique({ where: { id } });
	}

	findRequestsByPatientId(patientId: string): Promise<ConsentRequest[]> {
		return this.db.consentRequest.findMany({ where: { patientId } });
	}

	findRequestsByClinicId(clinicId: string): Promise<ConsentRequest[]> {
		return this.db.consentRequest.findMany({ where: { clinicId } });
	}

	updateRequestStatus(id: string, status: ConsentRequestStatus): Promise<ConsentRequest> {
		return this.db.consentRequest.update({ where: { id }, data: { status } });
	}

	createConsent(data: Prisma.ConsentUncheckedCreateInput): Promise<Consent> {
		return this.db.consent.create({ data });
	}

	findConsentById(id: string): Promise<Consent | null> {
		return this.db.consent.findUnique({ where: { id } });
	}

	findConsentsByPatientId(patientId: string): Promise<Consent[]> {
		return this.db.consent.findMany({ where: { patientId } });
	}

	findActiveConsentForClinicAndResult(clinicId: string, testResultId: string): Promise<Consent | null> {
		const now = new Date();
		return this.db.consent.findFirst({
			where: {
				clinicId,
				testResultId,
				revokedAt: null,
				OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
			},
		});
	}

	findActiveConsentsForClinicAndPatient(clinicId: string, patientId: string): Promise<Consent[]> {
		const now = new Date();
		return this.db.consent.findMany({
			where: {
				clinicId,
				patientId,
				revokedAt: null,
				OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
			},
		});
	}

	revokeConsent(id: string): Promise<Consent> {
		return this.db.consent.update({ where: { id }, data: { revokedAt: new Date() } });
	}
}
