import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const ConsentRequestSchema = z.object({
	id: z.string(),
	patientId: z.string(),
	clinicId: z.string(),
	testResultId: z.string().nullable(),
	requestedAt: z.coerce.date(),
	expiresAt: z.coerce.date(),
	status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']),
	type: z.enum(['SPECIFIC', 'ALL']),
});

export const ConsentSchema = z.object({
	id: z.string(),
	patientId: z.string(),
	clinicId: z.string(),
	testResultId: z.string().nullable(),
	consentRequestId: z.string(),
	resultStartAt: z.coerce.date().nullable(),
	resultEndAt: z.coerce.date().nullable(),
	grantedAt: z.coerce.date(),
	expiresAt: z.coerce.date().nullable(),
	revokedAt: z.coerce.date().nullable(),
});

export const CreateConsentRequestBodySchema = z.object({
	patientId: z.string(),
	clinicId: z.string(),
	type: z.enum(['SPECIFIC', 'ALL']),
	testResultId: z.string().optional(),
});

export const ApproveConsentRequestBodySchema = z.object({
	resultStartAt: z.coerce.date().optional(),
	resultEndAt: z.coerce.date().optional(),
});

export const GetConsentRequestsQuerySchema = z.object({
	patientId: z.string().optional(),
	clinicId: z.string().optional(),
});

export const GetConsentsQuerySchema = z.object({
	patientId: z.string(),
});

const ErrorSchema = z.object({ message: z.string() });

export const consentContract = c.router({
	createConsentRequest: {
		method: 'POST',
		path: '/consent-requests',
		body: CreateConsentRequestBodySchema,
		responses: {
			201: ConsentRequestSchema,
			400: ErrorSchema,
			403: ErrorSchema,
		},
	},
	getConsentRequests: {
		method: 'GET',
		path: '/consent-requests',
		query: GetConsentRequestsQuerySchema,
		responses: {
			200: z.array(ConsentRequestSchema),
			400: ErrorSchema,
		},
	},
	getConsentRequest: {
		method: 'GET',
		path: '/consent-requests/:id',
		responses: {
			200: ConsentRequestSchema,
			403: ErrorSchema,
			404: ErrorSchema,
		},
	},
	approveConsentRequest: {
		method: 'POST',
		path: '/consent-requests/:id/approve',
		body: ApproveConsentRequestBodySchema,
		responses: {
			200: z.object({ consentRequest: ConsentRequestSchema, consent: ConsentSchema }),
			400: ErrorSchema,
			403: ErrorSchema,
			404: ErrorSchema,
		},
	},
	rejectConsentRequest: {
		method: 'POST',
		path: '/consent-requests/:id/reject',
		body: z.object({}),
		responses: {
			200: ConsentRequestSchema,
			400: ErrorSchema,
			403: ErrorSchema,
			404: ErrorSchema,
		},
	},
	getConsents: {
		method: 'GET',
		path: '/consents',
		query: GetConsentsQuerySchema,
		responses: {
			200: z.array(ConsentSchema),
			403: ErrorSchema,
		},
	},
	revokeConsent: {
		method: 'POST',
		path: '/consents/:id/revoke',
		body: z.object({}),
		responses: {
			200: ConsentSchema,
			400: ErrorSchema,
			403: ErrorSchema,
			404: ErrorSchema,
		},
	},
});
