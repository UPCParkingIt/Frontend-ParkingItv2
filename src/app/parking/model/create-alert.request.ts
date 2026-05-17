export interface CreateAlertRequest {
  parkingId: string;
  alertType: string;
  severity: string;
  description: string;
  parkingLogId: string | null;
}
