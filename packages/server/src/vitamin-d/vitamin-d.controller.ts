import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Put } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { recommendVitaminDIuPerDay } from './vitamin-d.recommendation';
import type { PrismaClient } from '@prisma/client';

const updateMetricsSchema = z.object({
	weightKg: z.number().positive().max(500).optional(),
	targetVitaminDNgMl: z.number().positive().max(200).optional(),
});

@Controller('b2c/patients/:patientId/vitamin-d')
export class VitaminDController {
	constructor(private readonly prisma: PrismaService) {}

	private get prismaClient(): PrismaClient {
		return this.prisma as unknown as PrismaClient;
	}

	private recommendationModel(): {
		findUnique: (args: unknown) => Promise<{
			recommendedIuPerDay: number;
			phases: unknown;
			context: string;
			disclaimer: string;
			algorithmVersion: string;
		} | null>;
		create: (args: unknown) => Promise<unknown>;
	} {
		const delegate = (this.prismaClient as unknown as Record<string, unknown>)['vitaminDRecommendation'];
		return delegate as {
			findUnique: (args: unknown) => Promise<{
				recommendedIuPerDay: number;
				phases: unknown;
				context: string;
				disclaimer: string;
				algorithmVersion: string;
			} | null>;
			create: (args: unknown) => Promise<unknown>;
		};
	}

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
		recommendedIuPerDay: number;
		phases: unknown;
		context: string;
		disclaimer: string;
		algorithmVersion: string;
	} | null> {
		return this.recommendationModel().findUnique({
			where: { testResultId },
			select: {
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
		const existing = await this.loadSnapshot(args.testResultId);
		if (existing) {
			return {
				recommendedIuPerDay: existing.recommendedIuPerDay,
				phases: existing.phases,
				context: existing.context,
				disclaimer: existing.disclaimer,
				algorithmVersion: existing.algorithmVersion,
			};
		}

		const computed = recommendVitaminDIuPerDay({
			weightKg: args.weightKg,
			currentVitaminDNgMl: args.currentVitaminDNgMl,
			targetVitaminDNgMl: args.targetVitaminDNgMl,
		});

		await this.recommendationModel().create({
			data: {
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
		});

		return computed;
	}

	@Get('latest')
	async getLatest(@Param('patientId') patientId: string): Promise<unknown> {
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
