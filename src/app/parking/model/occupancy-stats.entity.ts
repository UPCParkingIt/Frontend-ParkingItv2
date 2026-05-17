export interface OccupancyStatsEntity {
  totalEntries: number;
  totalExits: number;
  matchedExits: number;
  failedExits: number;
  alerts: number;
  averageOccupancyMinutes: number;
  occupancyRate: number;
}
