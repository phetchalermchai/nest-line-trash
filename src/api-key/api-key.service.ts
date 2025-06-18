import { Injectable, ForbiddenException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  async createKey(userId: string, name: string) {
    const plainKey = randomBytes(32).toString('hex');
    const hashedKey = await bcrypt.hash(plainKey, 10);

    const created = await this.prisma.apiKey.create({
      data: {
        key: hashedKey,
        userId,
        name,
      },
    });

    return { id: created.id, name: created.name, apiKey: plainKey };
  }

  async getKeys(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId, revokedAt: null },
      select: { id: true, name: true, createdAt: true, expiresAt: true },
    });
  }

  async revokeKey(id: string, userId: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key || key.userId !== userId) {
      throw new ForbiddenException();
    }

    return this.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
