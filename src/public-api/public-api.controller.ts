import { Controller, Get, Query } from '@nestjs/common';
import { PublicApiService } from './public-api.service';

@Controller('public')
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @Get('verify-api-key')
  async verify(@Query('key') key: string) {
    return this.publicApiService.verifyApiKey(key);
  }
}