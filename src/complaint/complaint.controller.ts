import {
  Body,
  Controller,
  Param,
  Get,
  Post,
  Put,
  Delete,
  Query,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ComplaintService } from './complaint.service';
import { StorageService } from '../storage/storage.service';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ComplaintStatus } from '@prisma/client';
import { UpdateComplaintDto } from './dto/update-complaint.dto';

@Controller('complaints')
export class ComplaintController {
  constructor(
    private readonly complaintService: ComplaintService,
    private readonly storageService: StorageService,
  ) { }

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

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: ComplaintStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const shouldPaginate = page !== undefined && limit !== undefined;
    return this.complaintService.findAllWithFilter({
      search,
      status,
      startDate,
      endDate,
      page: shouldPaginate ? Number(page) : undefined,
      limit: shouldPaginate ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.complaintService.findById(id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async deleteComplaint(@Param('id') id: string) {
    const deleted = await this.complaintService.deleteOne(id);
    if (!deleted) {
      throw new NotFoundException('ไม่พบรายการร้องเรียน');
    }
    return { message: 'ลบเรียบร้อยแล้ว' };
  }

  @Post("bulk")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async deleteMany(@Body('ids') ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('กรุณาส่ง array ของ ID');
    }
    await this.complaintService.deleteMany(ids);
    return { message: `ลบ ${ids.length} รายการเรียบร้อย` };
  }

  @Post("undo-delete")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async undoDelete(@Body() data: any) {
    return this.complaintService.restoreComplaint(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'imageBeforeFiles', maxCount: 5 },
      { name: 'imageAfterFiles', maxCount: 5 },
    ]),
  )
  async updateComplaint(
    @Param('id') id: string,
    @Body() data: UpdateComplaintDto,
    @UploadedFiles()
    files: { imageBeforeFiles?: Express.Multer.File[]; imageAfterFiles?: Express.Multer.File[] }
  ) {
    return this.complaintService.updateComplaint(id, {
      ...data,
      imageBeforeFiles: files.imageBeforeFiles || [],
      imageAfterFiles: files.imageAfterFiles || [],
    });
  }
}
