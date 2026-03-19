'use client';
/* eslint-disable max-statements, complexity -- B2C page: form, fetch, results, error states */
import { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ApiResponse = {
	patient: {
		id: string;
		firstName: string;
		lastName: string;
		weightKg: number | null;
		targetVitaminDNgMl: number | null;
	};
	testResult: {
		id: string;
		type: 'VITAMIN_D';
		value: string;
		testedAt: string;
		createdAt: string;
	} | null;
	recommendation:
		| {
				recommendedIuPerDay: number;
				phases: { phase: 'repletion' | 'maintenance'; iuPerDay: number; durationDays?: number }[];
				context: string;
				disclaimer: string;
		  }
		| null;
	message?: string;
};

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Home(): JSX.Element {
	const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';

	const [patientId, setPatientId] = useState<string>('');
	const [weightKg, setWeightKg] = useState<string>('');
	const [targetNgMl, setTargetNgMl] = useState<string>('30');

	const [data, setData] = useState<ApiResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const resultsRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const url = new URL(window.location.href);
		const fromQuery = url.searchParams.get('patientId');
		if (fromQuery) setPatientId(fromQuery);
	}, []);

	const fetchLatest = useCallback(async () => {
		if (!patientId) return;
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`${apiBase}/b2c/patients/${patientId}/vitamin-d/latest`, { cache: 'no-store' });
			if (!res.ok) {
				let detail: string | undefined;
				try {
					const body = (await res.json()) as { message?: string; detail?: string };
					detail = body.detail ?? body.message;
				} catch {
					// ignore
				}
				throw new Error(detail ? `Request failed (${res.status}): ${detail}` : `Request failed (${res.status})`);
			}
			const json = (await res.json()) as ApiResponse;
			setData(json);
			setWeightKg(json.patient.weightKg === null ? '' : String(json.patient.weightKg));
			setTargetNgMl(json.patient.targetVitaminDNgMl === null ? '30' : String(json.patient.targetVitaminDNgMl));
			setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
		} catch (e) {
			setData(null);
			const msg = e instanceof Error ? e.message : 'Unknown error';
			setError(
				msg.includes('fetch') || msg.includes('Failed')
					? `${msg} — Is the API running? Start it with: npm run start:dev (in packages/server), then open http://localhost:3001`
					: msg
			);
		} finally {
			setLoading(false);
		}
	}, [apiBase, patientId]);

	const saveMetrics = useCallback(async () => {
		if (!patientId) return;
		setSaving(true);
		setError(null);
		try {
			const body: { weightKg?: number; targetVitaminDNgMl?: number } = {};
			if (weightKg.trim()) body.weightKg = Number(weightKg);
			if (targetNgMl.trim()) body.targetVitaminDNgMl = Number(targetNgMl);

			const res = await fetch(`${apiBase}/b2c/patients/${patientId}/vitamin-d/metrics`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body),
			});
			if (!res.ok) throw new Error(`Save failed (${res.status})`);
			await fetchLatest();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Unknown error');
		} finally {
			setSaving(false);
		}
	}, [apiBase, patientId, weightKg, targetNgMl, fetchLatest]);

	const fullName = useMemo(() => {
		if (!data) return null;
		return `${data.patient.firstName} ${data.patient.lastName}`.trim();
	}, [data]);

	return (
		<div className="min-h-screen bg-base-100">
			<div className="mx-auto w-full max-w-4xl px-5 py-10">
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-bold tracking-tight">Vitamin D test results</h1>
					<p className="text-base-content/70">
						Auto-calculated dosing based on your <strong>body weight</strong>, <strong>current Vitamin D level</strong>, and <strong>target level</strong>. Recommendation is shown alongside your test result.
					</p>
					<p className="text-sm text-base-content/60">
						Paste a patient ID below and click <strong>Load latest</strong>. The API must be running on port 3003.
					</p>
				</div>

				<div className="mt-8 grid gap-4 rounded-2xl border border-base-300 bg-base-200/40 p-5 sm:grid-cols-2">
					<label className="form-control w-full">
						<div className="label">
							<span className="label-text font-semibold">Patient ID</span>
						</div>
						<input
							className="input input-bordered w-full"
							placeholder="Paste patient UUID…"
							value={patientId}
							onChange={(e) => setPatientId(e.target.value)}
						/>
					</label>

					<div className="flex items-end gap-3">
						<button type="button" className="btn btn-primary w-full" onClick={() => void fetchLatest()} disabled={!patientId || loading}>
							{loading ? 'Loading…' : 'Load latest'}
						</button>
					</div>

					<label className="form-control w-full">
						<div className="label">
							<span className="label-text font-semibold">Body weight (kg)</span>
						</div>
						<input
							className="input input-bordered w-full"
							inputMode="decimal"
							placeholder="e.g. 72"
							value={weightKg}
							onChange={(e) => setWeightKg(e.target.value)}
						/>
					</label>

					<label className="form-control w-full">
						<div className="label">
							<span className="label-text font-semibold">Target Vitamin D (ng/mL)</span>
						</div>
						<input
							className="input input-bordered w-full"
							inputMode="decimal"
							placeholder="e.g. 30"
							value={targetNgMl}
							onChange={(e) => setTargetNgMl(e.target.value)}
						/>
					</label>

					<div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="text-sm text-base-content/70">
							{fullName ? (
								<span>
									Loaded <span className="font-semibold text-base-content">{fullName}</span>
								</span>
							) : (
								<span>Tip: add `?patientId=...` to the URL for quick access.</span>
							)}
						</div>
						<button type="button" className="btn btn-outline" onClick={() => void saveMetrics()} disabled={!patientId || saving}>
							{saving ? 'Saving…' : 'Save personalization'}
						</button>
					</div>
				</div>

				{error ? (
					<div className="mt-6 alert alert-error text-left">
						<span className="break-words">{error}</span>
					</div>
				) : null}

				{data?.message ? (
					<div className="mt-6 alert alert-warning text-left">
						<span>{data.message}</span>
					</div>
				) : null}

				{data ? (
					<div ref={resultsRef} className="mt-10 scroll-mt-6">
						<h2 className="mb-1 text-xl font-bold text-base-content">Your results</h2>
						<p className="mb-4 text-sm text-base-content/60">Test result and recommended dosing plan together</p>
						<div className="grid gap-4 lg:grid-cols-2">
						<div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-semibold">Latest test result</h3>
								<span className="badge badge-outline">25(OH)D</span>
							</div>

							{data.testResult ? (
								<div className="mt-4">
									<div className="text-4xl font-bold">
										{data.testResult.value} <span className="text-base font-semibold text-base-content/70">ng/mL</span>
									</div>
									<div className="mt-2 text-sm text-base-content/70">
										Tested on <span className="font-medium text-base-content">{formatDate(data.testResult.testedAt)}</span>
									</div>
								</div>
							) : (
								<div className="mt-4 text-base-content/70">No result available.</div>
							)}
						</div>

						<div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-semibold">Recommended dosing plan</h3>
								<span className="badge badge-primary">IU/day</span>
							</div>

							{data.recommendation ? (
								<div className="mt-4 flex flex-col gap-4">
									{/* Actionable primary recommendation */}
									<div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
										<div className="text-sm font-medium text-base-content/80">Take daily</div>
										<div className="text-3xl font-bold">{data.recommendation.recommendedIuPerDay.toLocaleString()} IU/day</div>
										<div className="mt-1 text-sm text-base-content/70">Recommended IU per day based on your metrics</div>
									</div>

									{/* Personalization context */}
									<div className="rounded-xl bg-base-200/50 p-3">
										<div className="text-xs font-semibold uppercase tracking-wide text-base-content/60">Based on your weight and levels</div>
										<div className="mt-1 text-sm text-base-content/80">{data.recommendation.context}</div>
									</div>

									{/* Phases: clear, actionable steps */}
									<div className="space-y-2">
										<div className="text-sm font-semibold text-base-content/80">Your plan</div>
										{data.recommendation.phases.map((p) => (
											<div
												key={`${p.phase}-${p.iuPerDay}-${p.durationDays ?? 'ongoing'}`}
												className="flex items-start justify-between gap-4 rounded-xl border border-base-200 p-4"
											>
												<div>
													<div className="font-semibold capitalize">{p.phase}</div>
													<div className="text-sm text-base-content/70">
														{p.durationDays
															? `Take ${p.iuPerDay.toLocaleString()} IU/day for ${p.durationDays} days, then reassess.`
															: 'Ongoing: take daily for maintenance.'}
													</div>
												</div>
												<div className="text-right shrink-0">
													<div className="text-xl font-bold">{p.iuPerDay.toLocaleString()}</div>
													<div className="text-sm text-base-content/70">IU/day</div>
												</div>
											</div>
										))}
									</div>

									<div className="text-xs leading-5 text-base-content/60">{data.recommendation.disclaimer}</div>
								</div>
							) : (
								<div className="mt-4 text-base-content/70">
									Add your <strong>body weight</strong> (and optionally target level) above and save to generate a personalized IU/day plan based on your metrics.
								</div>
							)}
						</div>
						</div>
					</div>
				) : (
					<div className="mt-8 rounded-xl border border-dashed border-base-300 bg-base-200/30 p-8 text-center text-base-content/70">
						Enter a patient ID above and click <strong>Load latest</strong> to see your test result and dosing plan here.
					</div>
				)}
			</div>
		</div>
	);
}
