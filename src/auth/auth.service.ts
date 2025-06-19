import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

    async syncOAuthUser(data: { profile: any; provider: string }) {
        const { profile, provider } = data;

        if (!profile || !provider) {
            throw new Error('Missing profile or provider');
        }

        const email = profile.email;
        const name = profile.name;
        const providerAccountId = profile.sub ?? profile.id;

        const account = await this.prisma.account.findUnique({
            where: {
                provider_providerAccountId: {
                    provider,
                    providerAccountId,
                },
            },
            include: { user: true },
        });

        if (account) {
            return {
                id: account.user.id,
                role: account.user.role,
                status: account.user.status,
            };
        }

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
}