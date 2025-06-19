import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PublicApiService {
  constructor(private readonly prisma: PrismaService) {}

  async verifyApiKey(plainKey: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: {
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      include: {
        user: true,
      },
    });

    for (const k of keys) {
      const match = await bcrypt.compare(plainKey, k.key);
      if (match) {
        return {
          valid: true,
          user: {
            id: k.user.id,
            name: k.user.name,
          },
        };
      }
    }

    return {
      valid: false,
      error: 'Invalid or expired key',
    };
  }
}