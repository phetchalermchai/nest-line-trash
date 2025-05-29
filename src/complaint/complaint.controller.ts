import {
    Body,
    Controller,
    Param,
    Post,
    Put,
    UploadedFiles,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { ComplaintService } from './complaint.service';
import { StorageService } from '../storage/storage.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';

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
            description: string;
            location?: string;
        },
    ) {
        // ✅ ตรวจว่ามีรูปไหม
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

    @Put(':id/done')
    markDone(@Param('id') id: string, @Body() body: { imageAfter: string }) {
        return this.complaintService.markAsDone(id, body.imageAfter);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Missing file');
        }

        const filename = `upload-${randomUUID()}.jpg`;
        const url = await this.storageService.uploadImage(file.buffer, filename);
        return { url };
    }
}
