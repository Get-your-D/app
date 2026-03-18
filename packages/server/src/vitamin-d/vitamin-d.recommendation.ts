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
};

function roundToNearest(value: number, step: number): number {
	return Math.round(value / step) * step;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
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

	// Rule-of-thumb: ~100 IU/day raises ~1 ng/mL over 8-12 weeks, scaled by weight.
	let repletion = delta * 100 * weightFactor;

	// Ensure meaningful minimums for deficiency.
	if (current < 10) repletion = Math.max(repletion, 6000);
	else if (current < 20) repletion = Math.max(repletion, 4000);
	else if (current < 30 && delta > 0) repletion = Math.max(repletion, 2000);

	repletion = clamp(repletion, 1000, 10000);
	const repletionRounded = roundToNearest(repletion, 500);

	// Conservative ongoing maintenance, scaled by weight.
	let maintenance = 1200 + 800 * weightFactor;
	maintenance = clamp(maintenance, 1000, 4000);
	const maintenanceRounded = roundToNearest(maintenance, 500);

	const phases: VitaminDRecommendationPhase[] = [];
	if (delta > 0) {
		phases.push({ phase: 'repletion', iuPerDay: repletionRounded, durationDays: 56 });
	}
	phases.push({ phase: 'maintenance', iuPerDay: maintenanceRounded });

	const recommendedIuPerDay = delta > 0 ? repletionRounded : maintenanceRounded;

	return {
		recommendedIuPerDay,
		phases,
		context: `Based on your weight (${Math.round(weightKg)} kg) and Vitamin D levels (current ${current} ng/mL → target ${target} ng/mL).`,
		disclaimer:
			'This recommendation is informational and not medical advice. Consider contraindications (e.g., hypercalcemia, kidney disease) and retest after the repletion phase.',
	};
}
