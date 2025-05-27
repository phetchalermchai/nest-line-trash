import { Body, Controller, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ComplaintService } from './complaint.service';
import { StorageService } from '../storage/storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';

@Controller('complaints')
export class ComplaintController {
    constructor(private readonly complaintService: ComplaintService, private readonly storageService: StorageService,) { }

    @Post()
    create(@Body() body: {
        lineUserId: string;
        description: string;
        imageBefore: string;
        location?: string;
    }) {
        return this.complaintService.createComplaint(body);
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
