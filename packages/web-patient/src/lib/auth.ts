const PATIENT_AUTH_KEY = 'patient_logged_in';

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PATIENT_AUTH_KEY) === 'true';
}

export function login(): void {
  localStorage.setItem(PATIENT_AUTH_KEY, 'true');
}

export function logout(): void {
  localStorage.removeItem(PATIENT_AUTH_KEY);
}
