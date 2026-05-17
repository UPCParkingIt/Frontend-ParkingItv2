export interface UserEntity {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profilePhotoUrl: string;
  dniNumber: string;
  roles: string[];
}
