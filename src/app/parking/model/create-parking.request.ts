export interface CreateParkingRequest {
  parkingName: string;
  latitude: number;
  longitude: number;
  address: string;
  totalSpots: number;
  baseTariffPerHour: number;
  reservationFee: number;
  currency: string;
  openTime: string;
  closeTime: string;
  businessDays: string;
  adminUserId: string;
}
