import {
  Body,
  Controller,
  Param,
  Get,
  Post,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { ComplaintService } from './complaint.service';
import { StorageService } from '../storage/storage.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('complaints')
export class ComplaintController {
  constructor(
    private readonly complaintService: ComplaintService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body()
    body: {
      lineUserId: string;
      lineDisplayName?: string;
      phone?: string;
      description: string;
      location?: string;
    },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('ต้องแนบรูปอย่างน้อย 1 รูป');
    }

    const imageUrls = await Promise.all(
      files.map(async (file) => {
        const filename = `complaint-${randomUUID()}.jpg`;
        return await this.storageService.uploadImage(file.buffer, filename);
      }),
    );

    return this.complaintService.createComplaint({
      ...body,
      imageBefore: imageUrls.join(','),
    });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.complaintService.findById(id);
  }

  @Post(':id/image-after')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FilesInterceptor('images'))
  async uploadImageAfter(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { message?: string },
  ) {
    const imageUrls = await Promise.all(
      files.map(async (file) => {
        const filename = `complaint-${randomUUID()}.jpg`;
        return await this.storageService.uploadImage(file.buffer, filename);
      }),
    );

    return this.complaintService.updateImageAfter(
      id,
      imageUrls.join(','),
      body.message,
    );
  }
}
