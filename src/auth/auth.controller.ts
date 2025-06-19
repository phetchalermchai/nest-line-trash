import { Body, Controller, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService // ✅ Inject เข้ามา
    ) { }

    @Post('sync')
    async syncOAuthUser(@Body() body: { profile: any; provider: string }) {
        const user = await this.authService.syncOAuthUser(body);
        const token = this.jwtService.sign({
            id: user.id,
            role: user.role,
            status: user.status,
        });

        return {
            id: user.id,
            role: user.role,
            status: user.status,
            accessToken: token,
        };
    }
}
