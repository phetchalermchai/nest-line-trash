import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    controllers: [DashboardController],
    providers: [DashboardService, PrismaService],
})
export class DashboardModule { }
