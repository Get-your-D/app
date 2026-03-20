import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from 'contracts';
import type { CallerContext } from 'src/auth/caller-context';
import { CurrentCaller } from 'src/auth/current-caller.decorator';
import { ConsentService } from 'src/features/consent/consent.service';

@Controller()
export class ConsentController {
	constructor(private readonly consentService: ConsentService) {}

	@TsRestHandler(contract.consent)
	handler(@CurrentCaller() caller: CallerContext) {
		return tsRestHandler(contract.consent, {
			createConsentRequest: async ({ body }) => {
				if (caller.type !== 'CLINIC') {
					return { status: 403 as const, body: { message: 'Only clinics can create consent requests' } };
				}
				if (body.clinicId !== caller.id) {
					return { status: 403 as const, body: { message: 'clinicId must match authenticated clinic' } };
				}

				try {
					const request = await this.consentService.createRequest({
						patientId: body.patientId,
						clinicId: body.clinicId,
						type: body.type,
						testResultId: body.testResultId,
					});
					return { status: 201 as const, body: request };
				} catch (error: unknown) {
					const message = error instanceof Error ? error.message : 'An unexpected error occurred';
					return { status: 400 as const, body: { message } };
				}
			},

			getConsentRequests: async () => {
				if (caller.type === 'PATIENT') {
					const requests = await this.consentService.getRequestsForPatient(caller.id);
					return { status: 200 as const, body: requests };
				}
				const requests = await this.consentService.getRequestsForClinic(caller.id);
				return { status: 200 as const, body: requests };
			},

			getConsentRequest: async ({ params: { id } }) => {
				const request = await this.consentService.findRequestById(id);
				if (!request) {
					return { status: 404 as const, body: { message: `ConsentRequest with id ${id} not found` } };
				}

				const isOwner =
					(caller.type === 'PATIENT' && request.patientId === caller.id) ||
					(caller.type === 'CLINIC' && request.clinicId === caller.id);

				if (!isOwner) {
					return { status: 403 as const, body: { message: 'Forbidden' } };
				}

				return { status: 200 as const, body: request };
			},

			approveConsentRequest: async ({ params: { id }, body }) => {
				if (caller.type !== 'PATIENT') {
					return { status: 403 as const, body: { message: 'Only patients can approve consent requests' } };
				}

				const request = await this.consentService.findRequestById(id);
				if (!request) {
					return { status: 404 as const, body: { message: `ConsentRequest with id ${id} not found` } };
				}
				if (request.patientId !== caller.id) {
					return { status: 403 as const, body: { message: 'Forbidden' } };
				}

				try {
					const result = await this.consentService.approveRequest(id, {
						resultStartAt: body.resultStartAt,
						resultEndAt: body.resultEndAt,
					});
					return { status: 200 as const, body: result };
				} catch (error: unknown) {
					const message = error instanceof Error ? error.message : 'An unexpected error occurred';
					return { status: 400 as const, body: { message } };
				}
			},

			rejectConsentRequest: async ({ params: { id } }) => {
				if (caller.type !== 'PATIENT') {
					return { status: 403 as const, body: { message: 'Only patients can reject consent requests' } };
				}

				const request = await this.consentService.findRequestById(id);
				if (!request) {
					return { status: 404 as const, body: { message: `ConsentRequest with id ${id} not found` } };
				}
				if (request.patientId !== caller.id) {
					return { status: 403 as const, body: { message: 'Forbidden' } };
				}

				try {
					const result = await this.consentService.rejectRequest(id);
					return { status: 200 as const, body: result };
				} catch (error: unknown) {
					const message = error instanceof Error ? error.message : 'An unexpected error occurred';
					return { status: 400 as const, body: { message } };
				}
			},

			getConsents: async ({ query }) => {
				if (caller.type !== 'PATIENT' || query.patientId !== caller.id) {
					return { status: 403 as const, body: { message: 'Forbidden' } };
				}

				const consents = await this.consentService.getConsentsForPatient(caller.id);
				return { status: 200 as const, body: consents };
			},

			revokeConsent: async ({ params: { id } }) => {
				if (caller.type !== 'PATIENT') {
					return { status: 403 as const, body: { message: 'Only patients can revoke consents' } };
				}

				const consent = await this.consentService.findConsentById(id);
				if (!consent) {
					return { status: 404 as const, body: { message: `Consent with id ${id} not found` } };
				}
				if (consent.patientId !== caller.id) {
					return { status: 403 as const, body: { message: 'Forbidden' } };
				}

				try {
					const revoked = await this.consentService.revokeConsent(id);
					return { status: 200 as const, body: revoked };
				} catch (error: unknown) {
					const message = error instanceof Error ? error.message : 'An unexpected error occurred';
					return { status: 400 as const, body: { message } };
				}
			},
		});
	}
}
