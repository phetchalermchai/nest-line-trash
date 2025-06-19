import { IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateApiKeyDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}