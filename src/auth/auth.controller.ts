import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() { }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleCallback(@Req() req: Request, @Res() res: Response) {
        const user = req.user as any;
        const { accessToken, email, role, sub } = user;
        const redirectUrl = `${process.env.FRONTEND_URL}/oauth/callback?token=${accessToken}&email=${email}&role=${role}&id=${sub}`;
        console.log('🔁 Redirecting to:', redirectUrl); 
        return res.redirect(redirectUrl);
    }

    @Get('link/google')
    @UseGuards(JwtAuthGuard, AuthGuard('google'))
    linkGoogle() { }

    @Get('line')
    @UseGuards(AuthGuard('line'))
    async lineAuth() { }

    @Get('line/callback')
    @UseGuards(AuthGuard('line'))
    async lineCallback(@Req() req: Request, @Res() res: Response) {
        const user = req.user as any;
        const { accessToken, email, role, sub } = user;
        const redirectUrl = `${process.env.FRONTEND_URL}/oauth/callback?token=${accessToken}&email=${email}&role=${role}&id=${sub}`;
        return res.redirect(redirectUrl);
    }

    @Get('link/line')
    @UseGuards(JwtAuthGuard, AuthGuard('line'))
    linkLine() { }

    @Get('facebook')
    @UseGuards(AuthGuard('facebook'))
    async facebookAuth() { }

    @Get('facebook/callback')
    @UseGuards(AuthGuard('facebook'))
    async facebookCallback(@Req() req: Request, @Res() res: Response) {
        const user = req.user as any;
        const { accessToken, email, role, sub } = user;
        const redirectUrl = `${process.env.FRONTEND_URL}/oauth/callback?token=${accessToken}&email=${email}&role=${role}&id=${sub}`;
        return res.redirect(redirectUrl);
    }

    @Get('link/facebook')
    @UseGuards(JwtAuthGuard, AuthGuard('facebook'))
    linkFacebook() { }
}
