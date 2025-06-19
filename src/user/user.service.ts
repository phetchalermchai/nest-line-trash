import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }

    async approveUser(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('ไม่พบผู้ใช้งานนี้');

        return this.prisma.user.update({
            where: { id },
            data: { status: 'APPROVED' },
        });
    }

    async findPendingUsers() {
        return this.prisma.user.findMany({
            where: { status: 'PENDING' },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                role: true,
            },
        });
    }
}
