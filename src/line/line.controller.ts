import { Controller, Post, Patch, Put, Param, Body, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { LineService } from './line.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('webhook/line')
export class LineController {
    constructor(private readonly lineService: LineService) { }

    @Put(':id/notify')
    async notifyGroup(@Param('id') id: string) {
        return this.lineService.notifyGroupAboutComplaint(id);
    }
}