import { Body, Controller, Param, Post, Put, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ComplaintService } from './complaint.service';
import { StorageService } from '../storage/storage.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { LineService } from '../line/line.service';

@Controller('complaints')
export class ComplaintController {
    constructor(private readonly complaintService: ComplaintService, private readonly storageService: StorageService, private readonly lineService: LineService) { }

    @Post()
    @UseInterceptors(FilesInterceptor('images'))
    async create(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() body: {
            lineUserId: string;
            description: string;
            location?: string;
        },
    ) {
        const imageUrls = await Promise.all(
            files.map(async (file) => {
                const filename = `complaint-${randomUUID()}.jpg`;
                return await this.storageService.uploadImage(file.buffer, filename);
            })
        );

        return this.complaintService.createComplaint({
            ...body,
            imageBefore: imageUrls.join(','),
        });
    }

    @Put(':id/notify')
    async notifyGroup(@Param('id') id: string) {
        return this.lineService.notifyGroupAboutComplaint(id);
    }

    @Put(':id/done')
    markDone(@Param('id') id: string, @Body() body: { imageAfter: string }) {
        return this.complaintService.markAsDone(id, body.imageAfter);
    }

    @Post('upload')
    @UseInterceptors(FilesInterceptor('file'))
    async uploadImage(@UploadedFiles() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Missing file');
        }

        const filename = `upload-${randomUUID()}.jpg`;
        const url = await this.storageService.uploadImage(file.buffer, filename);
        return { url };
    }
}
