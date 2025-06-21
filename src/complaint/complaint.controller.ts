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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ComplaintStatus, ComplaintSource } from '@prisma/client';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { LineService } from '../line/line.service';

@Controller('complaints')
export class ComplaintController {
  constructor(
    private readonly complaintService: ComplaintService,
    private readonly storageService: StorageService,
    private readonly lineService: LineService,
  ) { }

  @Post()
  @UseInterceptors(FilesInterceptor('imageBeforeFiles'))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body()
    body: CreateComplaintDto,
  ) {

    if (body.source === 'LINE') {
      if (!body.lineUserId) throw new BadRequestException('LINE: ต้องมี lineUserId');
      if (!files || files.length === 0) throw new BadRequestException('LINE: ต้องแนบรูป');
    } else {
      if (!body.receivedBy) throw new BadRequestException('เจ้าหน้าที่รับเรื่องต้องระบุ receivedBy');
      if (!body.reporterName) throw new BadRequestException('ต้องระบุชื่อผู้แจ้ง');
    }

    const imageUrls =
      files?.length > 0
        ? await Promise.all(files.map(async (file) => {
          const filename = `complaint-${randomUUID()}.jpg`;
          return await this.storageService.uploadImage(file.buffer, filename);
        }))
        : [];

    const complaint = await this.complaintService.createComplaint({
      ...body,
      imageBefore: imageUrls.join(','),
    });

    if (body.source === 'LINE') {
      await this.lineService.notifyUserAndGroup(complaint.id);
    } else {
      await this.lineService.notifyGroupOnly(complaint.id);
    }

    return complaint;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: ComplaintStatus,
    @Query('source') source?: ComplaintSource,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const shouldPaginate = page !== undefined && limit !== undefined;
    return this.complaintService.findAllWithFilter({
      search,
      status,
      source,
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
  @Roles('ADMIN', 'SUPERADMIN')
  async deleteComplaint(@Param('id') id: string) {
    const deleted = await this.complaintService.deleteOne(id);
    if (!deleted) {
      throw new NotFoundException('ไม่พบรายการร้องเรียน');
    }
    return { message: 'ลบเรียบร้อยแล้ว' };
  }

  @Post("bulk")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  async deleteMany(@Body('ids') ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('กรุณาส่ง array ของ ID');
    }
    await this.complaintService.deleteMany(ids);
    return { message: `ลบ ${ids.length} รายการเรียบร้อย` };
  }

  @Post("undo-delete")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  async undoDelete(@Body() data: any) {
    return this.complaintService.restoreComplaint(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
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
