import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ComplaintModule } from './complaint/complaint.module';
import { LineModule } from './line/line.module';
import { PrismaModule } from './prisma/prisma.module';
// import { StorageModule } from './storage/storage.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { JwtStrategy } from './auth/jwt.strategy';
import { ApiKeyController } from './api-key/api-key.controller';
import { ApiKeyService } from './api-key/api-key.service';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { PublicApiController } from './public-api/public-api.controller';
import { PublicApiService } from './public-api/public-api.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { MeController } from './me/me.controller';
import { MeModule } from './me/me.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ComplaintModule,
    LineModule,
    PrismaModule,
    DashboardModule,
    AuthModule,
    MeModule,
    // StorageModule,
  ],
  providers: [JwtStrategy, ApiKeyService, UserService, PublicApiService, AuthService],
  controllers: [ApiKeyController, UserController, PublicApiController, AuthController, MeController],
})
export class AppModule {}
