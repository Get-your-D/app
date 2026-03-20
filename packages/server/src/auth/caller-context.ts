export type CallerType = 'PATIENT' | 'CLINIC';

export interface CallerContext {
	id: string;
	accountId: string;
	type: CallerType;
}
