import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private prisma: PrismaService) {}

  @Get('linked-providers')
  async getLinkedProviders(@Req() req: any) {
    const userId = req.user.sub;

    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: { provider: true },
    });

    const linked = {
      google: false,
      line: false,
      facebook: false,
    };

    for (const acc of accounts) {
      if (acc.provider in linked) {
        linked[acc.provider] = true;
      }
    }

    return linked;
  }
}