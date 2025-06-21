import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.API_URL}/auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'displayName', 'picture.type(large)'],
      scope: 'email',
      passReqToCallback: true, // ✅ ต้องใส่
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    const currentUser = req.user as { id: string } | undefined;
    return this.authService.validateOAuthLogin(profile, 'facebook', currentUser);
  }
}