import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-line';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LineStrategy extends PassportStrategy(Strategy, 'line') {
  constructor(private authService: AuthService) {
    super({
      channelID: process.env.LINE_CHANNEL_ID,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
      callbackURL: `${process.env.API_URL}/auth/line/callback`,
      scope: ['profile', 'openid', 'email'],
      botPrompt: 'aggressive',
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request & { user?: { id: string } },
    accessToken: string,
    refreshToken: string,
    profile: Profile
  ) {
    console.log('[LINE] profile:', profile);
    const currentUser = req.user as { id: string }; // จาก JwtAuthGuard
    return this.authService.validateOAuthLogin(profile, 'line', currentUser);
  }
}