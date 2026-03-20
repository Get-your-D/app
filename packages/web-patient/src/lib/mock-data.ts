export const MOCK_TEST_RESULTS = [
  { id: '1', type: 'VITAMIN_D' as const, value: '45', testedAt: new Date('2026-03-15') },
  { id: '2', type: 'VITAMIN_D' as const, value: '22', testedAt: new Date('2026-01-10') },
  { id: '3', type: 'VITAMIN_D' as const, value: '15', testedAt: new Date('2025-11-05') },
];

export type ConsentStatus = 'PENDING' | 'ACTIVE' | 'DECLINED' | 'REVOKED';

export interface ConsentRequest {
  id: string;
  clinicName: string;
  testType: 'VITAMIN_D';
  status: ConsentStatus;
  requestedAt: Date;
  respondedAt?: Date;
}

export const MOCK_CONSENTS: ConsentRequest[] = [
  { id: 'c1', clinicName: 'Wellness Clinic',  testType: 'VITAMIN_D', status: 'PENDING',  requestedAt: new Date('2026-03-18') },
  { id: 'c2', clinicName: 'City Lab',          testType: 'VITAMIN_D', status: 'ACTIVE',   requestedAt: new Date('2026-01-10'), respondedAt: new Date('2026-01-12') },
  { id: 'c3', clinicName: 'Health Center',     testType: 'VITAMIN_D', status: 'DECLINED', requestedAt: new Date('2025-11-18'), respondedAt: new Date('2025-11-20') },
  { id: 'c4', clinicName: 'Metro Diagnostics', testType: 'VITAMIN_D', status: 'REVOKED',  requestedAt: new Date('2025-09-01'), respondedAt: new Date('2025-10-01') },
];
