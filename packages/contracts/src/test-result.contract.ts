import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const TestResultSchema = z.object({
	id: z.string(),
	patientId: z.string(),
	type: z.enum(['VITAMIN_D']),
	value: z.string(),
	testedAt: z.coerce.date(),
	createdAt: z.coerce.date(),
	testedById: z.string().nullable(),
	deletedAt: z.coerce.date().nullable(),
});

export const CreateTestResultBodySchema = z.object({
	patientId: z.string(),
	type: z.enum(['VITAMIN_D']),
	value: z.string(),
	testedAt: z.coerce.date(),
	testedById: z.string().optional(),
});

export const GetTestResultsQuerySchema = z.object({
	patientId: z.string().optional(),
});

export const testResultContract = c.router({
	createTestResult: {
		method: 'POST',
		path: '/test-results',
		body: CreateTestResultBodySchema,
		responses: {
			201: TestResultSchema,
		},
	},
	getTestResults: {
		method: 'GET',
		path: '/test-results',
		query: GetTestResultsQuerySchema,
		responses: {
			200: z.array(TestResultSchema),
		},
	},
	getTestResult: {
		method: 'GET',
		path: '/test-results/:id',
		responses: {
			200: TestResultSchema,
			403: z.object({ message: z.string() }),
			404: z.object({ message: z.string() }),
		},
	},
	deleteTestResult: {
		method: 'DELETE',
		path: '/test-results/:id',
		body: z.object({}),
		responses: {
			200: TestResultSchema,
			403: z.object({ message: z.string() }),
			404: z.object({ message: z.string() }),
		},
	},
});
