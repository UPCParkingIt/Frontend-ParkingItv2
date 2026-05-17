export interface FaceRecognitionEntity {
  id: string;
  userId: string;
  deviceId: string;
  faceImageData: string;
  faceEncodingVector: string;
  isActive: boolean;
}
