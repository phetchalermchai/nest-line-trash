import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

interface RequestWithUser extends Request {
    user: {
        id: string;
        role: string;
        status: string;
    };
}

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService // ✅ Inject เข้ามา
    ) { }

    @Post('sync')
    async syncOAuthUser(@Body() body: { profile: any; provider: string; currentUserId?: string }) {
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

    @Get('linked-accounts')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    async getLinkedAccounts(@Req() req: RequestWithUser) {
        return this.authService.getLinkedAccounts(req.user.id);
    }
}
