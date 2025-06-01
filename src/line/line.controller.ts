import { Controller, Post, UseGuards, Put, Param, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { LineService } from './line.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('webhook/line')
export class LineController {
    constructor(private readonly lineService: LineService) { }

    @Put(':id/notify')
    async notifyGroup(@Param('id') id: string) {
        return this.lineService.notifyGroupAboutComplaint(id);
    }

    @Post('complaints/:id/image-after')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @UseInterceptors(FileInterceptor('images'))
    uploadAfterImage(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body('message') message: string,
    ) {
        return this.lineService.uploadImageAfter(id, file, message);
    }
}