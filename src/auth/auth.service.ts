import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

    async syncOAuthUser(data: { profile: any; provider: string; currentUserId?: string }) {
        const { profile, provider, currentUserId } = data;
        console.log("[DEBUG] Received profile:", profile);
        if (!profile || !provider) {
            throw new Error('Missing profile or provider');
        }

        const providerAccountId = profile.sub ?? profile.id ?? profile.userId ?? null;
        const email = profile.email ?? null;
        const name = profile.name;

        if (!providerAccountId) {
            throw new Error("Missing providerAccountId");
        }

        // ✅ Step 1: ตรวจสอบบัญชี provider เดิม
        const existingAccount = await this.prisma.account.findUnique({
            where: {
                provider_providerAccountId: {
                    provider,
                    providerAccountId,
                },
            },
            include: { user: true },
        });

        if (existingAccount) {
            return {
                id: existingAccount.user.id,
                role: existingAccount.user.role,
                status: existingAccount.user.status,
            };
        }

        // ✅ Step 2: ถ้ามี currentUserId → ถือว่าเป็นการเชื่อมบัญชี
        if (currentUserId) {
            await this.prisma.account.create({
                data: {
                    provider,
                    providerAccountId,
                    userId: currentUserId,
                },
            });

            const user = await this.prisma.user.findUnique({ where: { id: currentUserId } });
            if (!user) {
                throw new NotFoundException('User not found');
            }
            return {
                id: user.id,
                role: user.role,
                status: user.status,
            };
        }

        // ✅ Step 3: ถ้ามี email → ผูกกับ user ที่มี email เดิม
        if (email) {
            const userByEmail = await this.prisma.user.findUnique({ where: { email } });

            if (userByEmail) {
                await this.prisma.account.create({
                    data: {
                        provider,
                        providerAccountId,
                        userId: userByEmail.id,
                    },
                });

                return {
                    id: userByEmail.id,
                    role: userByEmail.role,
                    status: userByEmail.status,
                };
            }
        }

        // ✅ Step 4: สร้าง user ใหม่
        const newUser = await this.prisma.user.create({
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

        return {
            id: newUser.id,
            role: newUser.role,
            status: newUser.status,
        };
    }

    async getLinkedAccounts(userId: string): Promise<string[]> {
        const accounts = await this.prisma.account.findMany({
            where: { userId },
            select: { provider: true },
        });

        return accounts.map((acc) => acc.provider);
    }
}