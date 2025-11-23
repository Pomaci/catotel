declare namespace Express {
  export interface Request {
    user?: {
      sub: string;
      email: string;
      iat?: number;
      exp?: number;
    };
  }
}
