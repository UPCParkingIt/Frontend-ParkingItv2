export interface InitiateExitPaymentRequest {
  reservationId?: string | null;
  parkingLogId: string;
  amount: number;
  paymentMethod: string;
  description: string;
}
