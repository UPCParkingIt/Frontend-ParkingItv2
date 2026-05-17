export interface ReservationEntity {
  id: string;
  userId: string;
  parkingId: string;
  reservedFromTime: string;
  accessCodeExpiresAt: string;
  accessCode: string;
  status: string;
  reservationFee: number;
  entryTime: string | null;
  createdAt: string;
}
