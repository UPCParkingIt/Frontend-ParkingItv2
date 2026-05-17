export interface PromotionEntity {
  id: string;
  parkingId: string;
  title: string;
  description: string;
  discountPercent: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}
