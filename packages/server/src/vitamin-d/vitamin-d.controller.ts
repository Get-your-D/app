import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Put } from '@nestjs/common';
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

	@Get('latest')
	async getLatest(@Param('patientId') patientId: string): Promise<unknown> {
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

		const latest = await this.prisma.testResult.findFirst({
			where: { patientId, type: 'VITAMIN_D' },
			orderBy: { testedAt: 'desc' },
			select: { id: true, type: true, value: true, testedAt: true, createdAt: true },
		});

		if (!latest) {
			return {
				patient,
				testResult: null,
				recommendation: null,
				message: 'No Vitamin D test results found for this patient yet.',
			};
		}

		const currentVitaminDNgMl = Number(latest.value);
		if (!Number.isFinite(currentVitaminDNgMl)) {
			throw new BadRequestException('Stored Vitamin D result value is not numeric');
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

		return {
			patient,
			testResult: latest,
			recommendation: recommendVitaminDIuPerDay({
				weightKg,
				currentVitaminDNgMl,
				targetVitaminDNgMl,
			}),
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
