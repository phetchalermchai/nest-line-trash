import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err, user, info) {
    console.log('[JWT] User:', user);
    console.log('[JWT] Info:', info);
    if (err || !user) throw err || new UnauthorizedException();
    return user;
  }
}
