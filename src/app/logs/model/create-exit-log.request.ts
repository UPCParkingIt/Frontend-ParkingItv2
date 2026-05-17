export interface CreateExitLogRequest {
  entryLogId: string;
  licensePlate: string;
  facialEmbedding: string;
  isMatched: boolean;
  confidenceScore: number;
  parkingId: string;
}
