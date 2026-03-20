export const VITAMIN_D_UNIT = 'ng/mL';
export const VITAMIN_D_MAX_DISPLAY = 100;

export type VitaminDStatus = 'DEFICIENT' | 'INSUFFICIENT' | 'OPTIMAL' | 'HIGH';

interface StatusInfo {
  label: string;
  badgeClass: string;
  range: string;
}

export function getVitaminDStatus(value: number): VitaminDStatus {
  if (value < 20) return 'DEFICIENT';
  if (value < 30) return 'INSUFFICIENT';
  if (value <= 50) return 'OPTIMAL';
  return 'HIGH';
}

export function getVitaminDStatusInfo(status: VitaminDStatus): StatusInfo {
  switch (status) {
    case 'DEFICIENT':
      return { label: 'Deficient', badgeClass: 'badge-error', range: '< 20 ng/mL' };
    case 'INSUFFICIENT':
      return { label: 'Insufficient', badgeClass: 'badge-warning', range: '20–30 ng/mL' };
    case 'OPTIMAL':
      return { label: 'Optimal', badgeClass: 'badge-success', range: '30–50 ng/mL' };
    case 'HIGH':
      return { label: 'High', badgeClass: 'badge-warning', range: '> 50 ng/mL' };
  }
}

export function getVitaminDDosage(value: number): {
  amountIU: number;
  timelineInDays: number;
  note: string;
} {
  const status = getVitaminDStatus(value);
  switch (status) {
    case 'DEFICIENT':
      return {
        amountIU: 5000,
        timelineInDays: 90,
        note: 'Your level is critically low. High-dose supplementation is recommended.',
      };
    case 'INSUFFICIENT':
      return {
        amountIU: 2000,
        timelineInDays: 60,
        note: 'Your level is below the optimal range. Supplementation is recommended.',
      };
    case 'OPTIMAL':
      return {
        amountIU: 1000,
        timelineInDays: 30,
        note: 'Maintenance dose — your level is in the optimal range.',
      };
    case 'HIGH':
      return {
        amountIU: 0,
        timelineInDays: 0,
        note: 'Your level is above the optimal range. Consult your doctor before supplementing.',
      };
  }
}
