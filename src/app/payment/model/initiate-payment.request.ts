export interface InitiatePaymentRequest {
  reservationId: string;
  amount: number;
  paymentMethod: string;
  description: string;
}
