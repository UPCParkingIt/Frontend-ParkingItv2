export interface AlertEntity {
  id: string;
  parkingId: string;
  alertType: string;
  severity: string;
  description: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  resolvedAt: string | null;
  reviewerNotes: string | null;
}
