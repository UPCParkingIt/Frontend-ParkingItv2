export interface PaymentEntity {
  id: string;
  reservationId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStage: string;
  status: string;
  referenceNumber: string | null;
  externalTransactionId: string | null;
  initiatedAt: string;
  completedAt: string | null;
  refundedAt: string | null;
  failureReason: string | null;
  retryCount: number;
}
