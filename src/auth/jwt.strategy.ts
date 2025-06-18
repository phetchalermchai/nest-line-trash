import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET environment variable is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
  if (!payload?.id || !payload?.role || !payload?.status) {
    throw new UnauthorizedException('Invalid token payload');
  }
  return payload;
}
}
