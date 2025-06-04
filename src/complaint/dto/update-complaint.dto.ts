import { IsOptional, IsString, IsEnum } from 'class-validator';

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
  @IsEnum(['PENDING', 'DONE'])
  status?: 'PENDING' | 'DONE';

  @IsOptional()
  @IsString()
  imageBefore?: string;

  @IsOptional()
  @IsString()
  imageAfter?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
