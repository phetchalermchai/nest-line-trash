import {
  Controller, Get, Post, Delete, Body, Param, UseGuards, Req
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get()
  async getMyKeys(@Req() req) {
    return this.apiKeyService.getKeys(req.user.id);
  }

  @Post()
  async createKey(@Req() req, @Body('name') name: string) {
    return this.apiKeyService.createKey(req.user.id, name);
  }

  @Delete(':id')
  async revokeKey(@Param('id') id: string, @Req() req) {
    return this.apiKeyService.revokeKey(id, req.user.id);
  }
}
