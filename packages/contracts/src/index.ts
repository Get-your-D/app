import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

const vitaminDRecommendationPhaseSchema = z.object({
	phase: z.enum(['repletion', 'maintenance']),
	iuPerDay: z.number().int().positive(),
	durationDays: z.number().int().positive().optional(),
});

const vitaminDRecommendationSchema = z.object({
	recommendedIuPerDay: z.number().int().positive(),
	phases: z.array(vitaminDRecommendationPhaseSchema).min(1),
	context: z.string(),
	disclaimer: z.string(),
	algorithmVersion: z.string(),
});

const patientVitDContextSchema = z.object({
	id: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	weightKg: z.number().nullable(),
	targetVitaminDNgMl: z.number().nullable(),
});

const testResultSchema = z.object({
	id: z.string(),
	type: z.literal('VITAMIN_D'),
	value: z.string(),
	valueNumber: z.number().nullable().optional(),
	unit: z.enum(['NG_ML', 'NMOL_L']).nullable().optional(),
	testedAt: z.string().datetime(),
	createdAt: z.string().datetime(),
});

export const contract = c.router({
	b2c: {
		patients: {
			vitaminD: c.router({
				latest: {
					method: 'GET',
					path: '/b2c/patients/:patientId/vitamin-d/latest',
					responses: {
						200: z.object({
							patient: patientVitDContextSchema,
							testResult: testResultSchema.nullable(),
							recommendation: vitaminDRecommendationSchema.nullable(),
							message: z.string().optional(),
						}),
					},
					summary: 'Get latest Vitamin D result + personalized dosing recommendation',
				},
				updateMetrics: {
					method: 'PUT',
					path: '/b2c/patients/:patientId/vitamin-d/metrics',
					body: z.object({
						weightKg: z.number().positive().max(500).optional(),
						targetVitaminDNgMl: z.number().positive().max(200).optional(),
					}),
					responses: {
						200: z.object({
							patient: z.object({
								id: z.string(),
								weightKg: z.number().nullable(),
								targetVitaminDNgMl: z.number().nullable(),
							}),
						}),
					},
					summary: 'Update patient weight/target for personalization',
				},
			}),
		},
	},
});
