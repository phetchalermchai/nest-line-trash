import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ComplaintModule } from './complaint/complaint.module';
import { LineModule } from './line/line.module';
import { PrismaModule } from './prisma/prisma.module';
// import { StorageModule } from './storage/storage.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ComplaintModule,
    LineModule,
    PrismaModule,
    DashboardModule,
    // StorageModule,
  ],
})
export class AppModule {}
