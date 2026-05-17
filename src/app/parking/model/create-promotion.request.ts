export interface CreatePromotionRequest {
  parkingId: string;
  title: string;
  description: string;
  discountPercent: number;
  validFrom: string;
  validTo: string;
}
