import {
	BadRequestException,
	Body,
	Controller,
	Get,
	InternalServerErrorException,
	NotFoundException,
	Param,
	Put,
} from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { recommendVitaminDIuPerDay } from './vitamin-d.recommendation';

const updateMetricsSchema = z.object({
	weightKg: z.number().positive().max(500).optional(),
	targetVitaminDNgMl: z.number().positive().max(200).optional(),
});

@Controller('b2c/patients/:patientId/vitamin-d')
export class VitaminDController {
	constructor(private readonly prisma: PrismaService) {}

	private async loadPatient(patientId: string): Promise<{
		id: string;
		firstName: string;
		lastName: string;
		weightKg: number | null;
		targetVitaminDNgMl: number | null;
	}> {
		const patient = await this.prisma.patient.findUnique({
			where: { id: patientId },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				weightKg: true,
				targetVitaminDNgMl: true,
			},
		});
		if (!patient) throw new NotFoundException('Patient not found');
		return patient;
	}

	private loadLatestVitaminDTestResult(patientId: string): Promise<{
		id: string;
		type: 'VITAMIN_D';
		value: string;
		testedAt: Date;
		createdAt: Date;
	} | null> {
		return this.prisma.testResult.findFirst({
			where: { patientId, type: 'VITAMIN_D' },
			orderBy: { testedAt: 'desc' },
			select: {
				id: true,
				type: true,
				value: true,
				testedAt: true,
				createdAt: true,
			},
		});
	}

	private parseCurrentVitaminDNgMl(latest: { value: string }): number {
		const currentNumeric = Number(latest.value);
		if (!Number.isFinite(currentNumeric)) throw new BadRequestException('Stored Vitamin D result value is not numeric');
		return currentNumeric;
	}

	private loadSnapshot(testResultId: string): Promise<{
		// Snapshot inputs (for cache invalidation)
		weightKg: number;
		currentVitaminDNgMl: number;
		targetVitaminDNgMl: number;

		recommendedIuPerDay: number;
		phases: unknown;
		context: string;
		disclaimer: string;
		algorithmVersion: string;
	} | null> {
		return this.prisma.vitaminDRecommendation.findUnique({
			where: { testResultId },
			select: {
				weightKg: true,
				currentVitaminDNgMl: true,
				targetVitaminDNgMl: true,
				recommendedIuPerDay: true,
				phases: true,
				context: true,
				disclaimer: true,
				algorithmVersion: true,
			},
		});
	}

	private async getOrCreateRecommendation(args: {
		patientId: string;
		testResultId: string;
		weightKg: number;
		currentVitaminDNgMl: number;
		targetVitaminDNgMl: number;
	}): Promise<{
		recommendedIuPerDay: number;
		phases: unknown;
		context: string;
		disclaimer: string;
		algorithmVersion: string;
	}> {
		const computed = recommendVitaminDIuPerDay({
			weightKg: args.weightKg,
			currentVitaminDNgMl: args.currentVitaminDNgMl,
			targetVitaminDNgMl: args.targetVitaminDNgMl,
		});

		const existing = await this.loadSnapshot(args.testResultId);

		// Snapshot cache key is effectively (testResultId + personalization inputs + algorithm version).
		// If inputs changed (via "Save personalization"), recompute and overwrite the snapshot.
		const inputsMatch =
			existing &&
			Math.abs(existing.weightKg - args.weightKg) < 1e-6 &&
			Math.abs(existing.currentVitaminDNgMl - args.currentVitaminDNgMl) < 1e-6 &&
			Math.abs(existing.targetVitaminDNgMl - args.targetVitaminDNgMl) < 1e-6 &&
			existing.algorithmVersion === computed.algorithmVersion;

		if (inputsMatch) return computed;

		await this.prisma.vitaminDRecommendation.upsert({
			where: { testResultId: args.testResultId },
			create: {
				patientId: args.patientId,
				testResultId: args.testResultId,
				weightKg: args.weightKg,
				currentVitaminDNgMl: args.currentVitaminDNgMl,
				targetVitaminDNgMl: args.targetVitaminDNgMl,
				recommendedIuPerDay: computed.recommendedIuPerDay,
				phases: computed.phases,
				context: computed.context,
				disclaimer: computed.disclaimer,
				algorithmVersion: computed.algorithmVersion,
			},
			update: {
				patientId: args.patientId,
				weightKg: args.weightKg,
				currentVitaminDNgMl: args.currentVitaminDNgMl,
				targetVitaminDNgMl: args.targetVitaminDNgMl,
				recommendedIuPerDay: computed.recommendedIuPerDay,
				phases: computed.phases,
				context: computed.context,
				disclaimer: computed.disclaimer,
				algorithmVersion: computed.algorithmVersion,
			},
		});

		return computed;
	}

	@Get('latest')
	// eslint-disable-next-line max-statements -- single handler with clear branches
	async getLatest(@Param('patientId') patientId: string): Promise<unknown> {
		try {
			const patient = await this.loadPatient(patientId);
			const latest = await this.loadLatestVitaminDTestResult(patientId);

			if (!latest) {
				return {
					patient,
					testResult: null,
					recommendation: null,
					message: 'No Vitamin D test results found for this patient yet.',
				};
			}

			const weightKg = patient.weightKg ?? undefined;
			const targetVitaminDNgMl = patient.targetVitaminDNgMl ?? 30;

			if (!weightKg) {
				return {
					patient,
					testResult: latest,
					recommendation: null,
					message: 'Missing patient weight. Add weight to generate a personalized recommendation.',
				};
			}

			const recommendation = await this.getOrCreateRecommendation({
				patientId,
				testResultId: latest.id,
				weightKg,
				currentVitaminDNgMl: this.parseCurrentVitaminDNgMl(latest),
				targetVitaminDNgMl,
			});

			return {
				patient,
				testResult: latest,
				recommendation,
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error('[VitaminD getLatest]', err);
			throw new InternalServerErrorException({ message: 'Vitamin D latest failed', detail: message });
		}
	}

	@Put('metrics')
	async updateMetrics(@Param('patientId') patientId: string, @Body() body: unknown): Promise<unknown> {
		const parsed = updateMetricsSchema.safeParse(body);
		if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

		const updated = await this.prisma.patient.update({
			where: { id: patientId },
			data: parsed.data,
			select: { id: true, weightKg: true, targetVitaminDNgMl: true },
		});

		return { patient: updated };
	}
}
