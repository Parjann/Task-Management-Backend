export interface JwtPayload {
  sub: string;
  email: string;
  isGuest: boolean;
}