import { Controller, Post, Patch, Put, Param, Body, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { LineService } from './line.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('webhook/line')
export class LineController {
    constructor(private readonly lineService: LineService) { }

    @Post()
    handleWebhook(@Req() req: any) {
        return this.lineService.handleWebhook(req.body);
    }

    @Put(':id/notify')
    async notifyGroup(@Param('id') id: string) {
        return this.lineService.notifyGroupAboutComplaint(id);
    }

    @Patch('complaints/:id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.lineService.updateComplaintStatus(id, status);
    }

    @Post('complaints/:id/image-after')
    @UseInterceptors(FileInterceptor('image'))
    uploadImageAfter(
        @Param('id') id: string,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.lineService.uploadImageAfter(id, file);
    }
}