import { NextFunction, Request, Response } from 'express';

export function cookieTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken;
  console.log('🍪 Cookie Token (link):', token);
  if (token) {
    req.headers['authorization'] = `Bearer ${token}`;
  }
  next();
}