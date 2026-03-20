import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from 'contracts';
import type { CallerContext } from 'src/auth/caller-context';
import { CurrentCaller } from 'src/auth/current-caller.decorator';
import { ConsentService } from 'src/features/consent/consent.service';
import { TestResultService } from 'src/features/test-result/test-result.service';

@Controller()
export class TestResultController {
	constructor(
		private readonly testResultService: TestResultService,
		private readonly consentService: ConsentService,
	) {}

	@TsRestHandler(contract.testResults)
	handler(@CurrentCaller() caller: CallerContext) {
		return tsRestHandler(contract.testResults, {
			createTestResult: async ({ body }) => {
				const patientId = caller.type === 'PATIENT' ? caller.id : body.patientId;
				const testedById = caller.type === 'CLINIC' ? caller.id : undefined;

				const result = await this.testResultService.create({
					patientId,
					type: body.type,
					value: body.value,
					testedAt: body.testedAt,
					testedById,
				});

				return { status: 201 as const, body: result };
			},

			getTestResults: async ({ query }) => {
				if (caller.type === 'PATIENT') {
					const results = await this.testResultService.findAll(caller.id);
					return { status: 200 as const, body: results };
				}

				// CLINIC: must have a patientId to query consent-filtered results
				const patientId = query.patientId;
				if (!patientId) {
					return { status: 200 as const, body: [] };
				}

				const results = await this.testResultService.findAllForClinic(caller.id, patientId);
				return { status: 200 as const, body: results };
			},

			getTestResult: async ({ params: { id } }) => {
				const result = await this.testResultService.findById(id).catch(() => null);
				if (!result) {
					return { status: 404 as const, body: { message: `TestResult with id ${id} not found` } };
				}

				if (caller.type === 'PATIENT') {
					if (result.patientId !== caller.id) {
						return { status: 403 as const, body: { message: 'Forbidden' } };
					}
					return { status: 200 as const, body: result };
				}

				// CLINIC: check consent
				const hasConsent = await this.consentService.checkConsentForClinicAndResult(caller.id, {
					id: result.id,
					patientId: result.patientId,
					testedAt: result.testedAt,
				});
				if (!hasConsent) {
					return { status: 403 as const, body: { message: 'No active consent for this test result' } };
				}

				return { status: 200 as const, body: result };
			},

			deleteTestResult: async ({ params: { id } }) => {
				if (caller.type !== 'PATIENT') {
					return { status: 403 as const, body: { message: 'Only patients can delete test results' } };
				}

				const result = await this.testResultService.findById(id).catch(() => null);
				if (!result) {
					return { status: 404 as const, body: { message: `TestResult with id ${id} not found` } };
				}

				if (result.patientId !== caller.id) {
					return { status: 403 as const, body: { message: 'Forbidden' } };
				}

				const deleted = await this.testResultService.delete(id);
				return { status: 200 as const, body: deleted };
			},
		});
	}
}
