import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComplaintStatus } from '@prisma/client';

@Injectable()
export class ComplaintService {
    constructor(private prisma: PrismaService) { }

    async createComplaint(data: {
        lineUserId: string;
        description: string;
        imageBefore: string;
        location?: string;
    }) {
        return this.prisma.complaint.create({
            data: {
                lineUserId: data.lineUserId,
                description: data.description,
                imageBefore: data.imageBefore,
                location: data.location,
                status: ComplaintStatus.PENDING,
            },
        });
    }

    async markAsDone(id: string, imageAfter: string) {
        return this.prisma.complaint.update({
            where: { id },
            data: {
                status: ComplaintStatus.DONE,
                imageAfter,
            },
        });
    }
}
