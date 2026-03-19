export type VitaminDRecommendationInput = {
	weightKg: number;
	currentVitaminDNgMl: number;
	targetVitaminDNgMl: number;
};

export type VitaminDRecommendationPhase = {
	phase: 'repletion' | 'maintenance';
	iuPerDay: number;
	durationDays?: number;
};

export type VitaminDRecommendation = {
	recommendedIuPerDay: number;
	phases: VitaminDRecommendationPhase[];
	context: string;
	disclaimer: string;
	algorithmVersion: string;
};

const ALGORITHM_VERSION = 'v1.0.0';

function roundToNearest(value: number, step: number): number {
	return Math.round(value / step) * step;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function computeRepletionIuPerDay(args: { delta: number; current: number; weightFactor: number }): number {
	// Rule-of-thumb: ~100 IU/day raises ~1 ng/mL over 8-12 weeks, scaled by weight.
	let repletion = args.delta * 100 * args.weightFactor;

	// Ensure meaningful minimums for deficiency.
	if (args.current < 10) repletion = Math.max(repletion, 6000);
	else if (args.current < 20) repletion = Math.max(repletion, 4000);
	else if (args.current < 30 && args.delta > 0) repletion = Math.max(repletion, 2000);

	repletion = clamp(repletion, 1000, 10000);
	return roundToNearest(repletion, 500);
}

function computeMaintenanceIuPerDay(weightFactor: number): number {
	let maintenance = 1200 + 800 * weightFactor;
	maintenance = clamp(maintenance, 1000, 4000);
	return roundToNearest(maintenance, 500);
}

function buildPhases(args: {
	delta: number;
	repletionRounded: number;
	maintenanceRounded: number;
}): VitaminDRecommendationPhase[] {
	const phases: VitaminDRecommendationPhase[] = [];
	if (args.delta > 0) phases.push({ phase: 'repletion', iuPerDay: args.repletionRounded, durationDays: 56 });
	phases.push({ phase: 'maintenance', iuPerDay: args.maintenanceRounded });
	return phases;
}

function buildContext(args: { weightKg: number; current: number; target: number }): string {
	return `Based on your weight (${Math.round(args.weightKg)} kg) and Vitamin D levels (current ${args.current} ng/mL → target ${args.target} ng/mL).`;
}

/**
 * Pragmatic, consumer-safe Vitamin D3 recommendation:
 * - Uses weight and delta-to-target to scale a short repletion phase.
 * - Includes a conservative maintenance phase.
 * - Caps at 10,000 IU/day (common non-prescription upper bound).
 */
export function recommendVitaminDIuPerDay(input: VitaminDRecommendationInput): VitaminDRecommendation {
	const weightKg = clamp(input.weightKg, 30, 250);
	const current = clamp(input.currentVitaminDNgMl, 0, 200);
	const target = clamp(input.targetVitaminDNgMl, 10, 100);

	const delta = Math.max(0, target - current);
	const weightFactor = clamp(weightKg / 70, 0.6, 1.6);

	const repletionRounded = computeRepletionIuPerDay({ delta, current, weightFactor });
	const maintenanceRounded = computeMaintenanceIuPerDay(weightFactor);
	const phases = buildPhases({ delta, repletionRounded, maintenanceRounded });

	const recommendedIuPerDay = delta > 0 ? repletionRounded : maintenanceRounded;

	return {
		recommendedIuPerDay,
		phases,
		context: buildContext({ weightKg, current, target }),
		disclaimer:
			'This recommendation is informational and not medical advice. Consider contraindications (e.g., hypercalcemia, kidney disease) and retest after the repletion phase.',
		algorithmVersion: ALGORITHM_VERSION,
	};
}
