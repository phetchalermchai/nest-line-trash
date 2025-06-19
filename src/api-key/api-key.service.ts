import { Injectable, ForbiddenException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) { }

  async createKey(userId: string, dto: CreateApiKeyDto) {
    const plainKey = randomBytes(32).toString('hex');
    const hashedKey = await bcrypt.hash(plainKey, 10);

    const created = await this.prisma.apiKey.create({
      data: {
        key: hashedKey,
        userId,
        name: dto.name,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });

    return {
      id: created.id,
      name: created.name,
      apiKey: plainKey,
      expiresAt: created.expiresAt,
    };
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

  async approveUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }
}
