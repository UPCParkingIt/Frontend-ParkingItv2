export interface ParkingLotEntity {
  id: string;
  parkingName: string;
  latitude: string;
  longitude: string;
  address: string;
  totalSpots: number;
  availableSpots: number;
  occupancyPercentage: number;
  baseTariffPerHour: number;
  reservationFee: number;
  currency: string;
  openTime: string;
  closeTime: string;
  businessDays: string;
  status: string;
  adminUserId: string;
  yapeQrUrl?: string;
}
