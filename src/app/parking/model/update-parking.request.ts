export interface UpdateParkingRequest {
  parkingName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  openTime?: string;
  closeTime?: string;
  businessDays?: string;
  newTariff?: number;
  newReservationFee?: number;
}
