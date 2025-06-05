import { Controller, Post, UseGuards, Put, Param, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { LineService } from './line.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('webhook/line')
export class LineController {
    constructor(private readonly lineService: LineService, private prisma: PrismaService) { }

    @Put(':id/notify')
    async notifyGroup(@Param('id') id: string) {
        return this.lineService.notifyNewComplaint(id);
    }

    @Put(":id/notify-group")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("admin")
    async notifyGroupManual(@Param("id") id: string) {
        const result = await this.lineService.notifyReminderComplaint(id);
        await this.prisma.complaint.update({
            where: { id },
            data: { notifiedAt: new Date() }
        });
        return result;
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