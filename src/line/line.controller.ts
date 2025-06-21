import { Controller, Post, UseGuards, Put, Param, Body, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { LineService } from './line.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('webhook/line')
export class LineController {
    constructor(private readonly lineService: LineService, private prisma: PrismaService) { }

    @Put(':id/notify')
    async notifyGroup(@Param('id') id: string) {
        return this.lineService.notifyNewComplaint(id);
    }

    @Put(":id/notify-group")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'SUPERADMIN')
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
    @Roles('ADMIN', 'SUPERADMIN')
    @UseInterceptors(FilesInterceptor('images'))
    async uploadAfterImages(
        @Param('id') id: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Body('message') message: string,
    ) {
        return this.lineService.uploadImageAfter(id, files, message);
    }
}