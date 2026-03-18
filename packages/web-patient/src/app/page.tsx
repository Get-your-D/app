'use client';

import { JSX, useCallback, useEffect, useMemo, useState } from 'react';

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
			if (!res.ok) throw new Error(`Request failed (${res.status})`);
			const json = (await res.json()) as ApiResponse;
			setData(json);
			setWeightKg(json.patient.weightKg === null ? '' : String(json.patient.weightKg));
			setTargetNgMl(json.patient.targetVitaminDNgMl === null ? '30' : String(json.patient.targetVitaminDNgMl));
		} catch (e) {
			setData(null);
			setError(e instanceof Error ? e.message : 'Unknown error');
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
						View your latest result and an auto-calculated dosing plan based on your weight and target level.
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
					<div className="mt-6 alert alert-error">
						<span>{error}</span>
					</div>
				) : null}

				{data?.message ? (
					<div className="mt-6 alert">
						<span>{data.message}</span>
					</div>
				) : null}

				{data ? (
					<div className="mt-6 grid gap-4 lg:grid-cols-2">
						<div className="rounded-2xl border border-base-300 bg-base-100 p-5">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold">Latest test result</h2>
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

						<div className="rounded-2xl border border-base-300 bg-base-100 p-5">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold">Recommended dosing plan</h2>
								<span className="badge badge-primary">IU/day</span>
							</div>

							{data.recommendation ? (
								<div className="mt-4 flex flex-col gap-4">
									<div className="rounded-xl bg-base-200/50 p-4">
										<div className="text-sm text-base-content/70">Recommended now</div>
										<div className="text-3xl font-bold">{data.recommendation.recommendedIuPerDay.toLocaleString()} IU/day</div>
										<div className="mt-2 text-sm text-base-content/80">{data.recommendation.context}</div>
									</div>

									<div className="space-y-3">
										{data.recommendation.phases.map((p) => (
											<div
												key={`${p.phase}-${p.iuPerDay}-${p.durationDays ?? 'ongoing'}`}
												className="flex items-start justify-between gap-4 rounded-xl border border-base-200 p-4"
											>
												<div>
													<div className="font-semibold capitalize">{p.phase}</div>
													<div className="text-sm text-base-content/70">
														{p.durationDays ? `For ${p.durationDays} days, then reassess.` : 'Ongoing daily maintenance.'}
													</div>
												</div>
												<div className="text-right">
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
									Add your weight (and optionally a target) to generate a personalized plan.
								</div>
							)}
						</div>
					</div>
				) : (
					<div className="mt-8 text-base-content/70">Enter a patient ID to load results and recommendations.</div>
				)}
			</div>
		</div>
	);
}
