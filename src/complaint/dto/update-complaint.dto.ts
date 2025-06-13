import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ComplaintStatus, ComplaintSource } from '@prisma/client';

export class UpdateComplaintDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsString()
  imageBefore?: string;

  @IsOptional()
  @IsString()
  imageAfter?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(ComplaintSource)
  source?: ComplaintSource;

  @IsOptional()
  @IsString()
  receivedBy?: string;

  @IsOptional()
  @IsString()
  reporterName?: string;
}
