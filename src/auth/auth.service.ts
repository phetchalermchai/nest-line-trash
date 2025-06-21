import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) { }

  async validateOAuthLogin(profile: any, provider: string, currentUser?: { id: string }) {
    const providerAccountId = profile.id || profile.sub;
    const email = profile.emails?.[0]?.value ?? null;
    const name = profile.displayName;
    const image = profile.photos?.[0]?.value ?? null;

    let user: any = null;

    // 1. หา account เดิม
    const account = await this.prisma.account.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    });

    if (account?.user) {
      user = account.user;
    }

    // 2. ✅ ถ้ามี currentUser = ผูกบัญชี
    if (currentUser) {
      const current = await this.prisma.user.findUnique({ where: { id: currentUser.id } });

      // ถ้ามี account แล้ว แต่ไม่ใช่ currentUser → ป้องกันผูกซ้ำผิด user
      if (user && user.id !== currentUser.id) {
        throw new Error(`บัญชี ${provider} นี้ถูกใช้โดยผู้ใช้คนอื่นแล้ว`);
      }

      // ถ้ายังไม่มี account → ผูกเพิ่ม
      if (!user) {
        await this.prisma.account.create({
          data: {
            provider,
            providerAccountId,
            userId: currentUser.id,
          },
        });
      }

      user = current;
    }

    // 3. ถ้าไม่มี currentUser และยังไม่เจอ user แต่มี email
    if (!user && email) {
      user = await this.prisma.user.findFirst({ where: { email } });
    }

    // 4. ยังไม่เจอ → สร้าง user ใหม่
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          role: Role.ADMIN,
          status: UserStatus.PENDING,
          accounts: {
            create: {
              provider,
              providerAccountId,
            },
          },
        },
      });
    } else if (!currentUser) {
      // กรณี login ปกติ (ไม่ใช่ผูกบัญชี) → upsert account
      await this.prisma.account.upsert({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
        update: {},
        create: {
          provider,
          providerAccountId,
          userId: user.id,
        },
      });
    }

    console.log('[OAuth] currentUser:', currentUser);
    console.log('[OAuth] Checking account:', provider, providerAccountId);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);
    return { ...payload, accessToken: token };
  }
}