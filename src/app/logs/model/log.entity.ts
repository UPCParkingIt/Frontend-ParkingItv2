export interface LogEntity {
  id: string;
  licensePlate: string;
  parkingId: string;
  userId: string;
  status: string;
  occupancyDurationMinutes: number | null;
  isAlertGenerated: boolean;
  alertReason: string | null;
  entryTimestamp: string;
  exitTimestamp: string | null;
  createdAt: string;
}
