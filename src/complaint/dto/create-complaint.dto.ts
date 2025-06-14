import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ComplaintSource } from '@prisma/client';

export class CreateComplaintDto {
  @IsEnum(ComplaintSource)
  source: ComplaintSource;

  @IsOptional()
  @IsString()
  receivedBy?: string;

  @IsOptional()
  @IsString()
  reporterName?: string;

  @IsOptional()
  @IsString()
  lineUserId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  location?: string;
}
