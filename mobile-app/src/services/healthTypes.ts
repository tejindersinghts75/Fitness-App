export type HealthPermissionStatus =
  | "notDetermined"
  | "authorized"
  | "denied"
  | "unsupported";

export type DailyHealthData = {
  steps: number;
  distanceKm: number;
};

export type HealthAvailability = {
  status: HealthPermissionStatus;
  message?: string;
};

export interface HealthService {
  getAvailability(): Promise<HealthAvailability>;
  requestPermissions(): Promise<HealthAvailability>;
  readToday(): Promise<DailyHealthData>;
}

export const EMPTY_DAILY_HEALTH_DATA: DailyHealthData = {
  steps: 0,
  distanceKm: 0,
};

