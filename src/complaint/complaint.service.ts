import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComplaintStatus, Prisma } from '@prisma/client';

@Injectable()
export class ComplaintService {
  constructor(private prisma: PrismaService) { }

  async createComplaint(data: {
    lineUserId: string;
    lineDisplayName?: string;
    phone?: string;
    description: string;
    imageBefore: string;
    location?: string;
  }) {
    return this.prisma.complaint.create({
      data: {
        lineUserId: data.lineUserId,
        lineDisplayName: data.lineDisplayName,
        phone: data.phone,
        description: data.description,
        imageBefore: data.imageBefore,
        location: data.location,
        status: ComplaintStatus.PENDING,
      },
    });
  }

  async updateStatus(id: string, status: ComplaintStatus) {
    return this.prisma.complaint.update({
      where: { id },
      data: { status },
    });
  }

  async updateImageAfter(id: string, imageAfter?: string, message?: string) {
    return this.prisma.complaint.update({
      where: { id },
      data: {
        ...(imageAfter && { imageAfter }),
        ...(message && { message }),
        status: ComplaintStatus.DONE,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.complaint.findUnique({ where: { id } });
  }

  async findAllWithFilter({
    search,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  }: {
    search?: string;
    status?: ComplaintStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const conditions: Prisma.ComplaintWhereInput[] = [];

    if (search) {
      conditions.push({
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { lineDisplayName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (status) {
      conditions.push({ status });
    }

    if (startDate) {
      conditions.push({ createdAt: { gte: new Date(startDate) } });
    }

    if (endDate) {
      conditions.push({ createdAt: { lte: new Date(endDate) } });
    }

    const where: Prisma.ComplaintWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    if (!page || !limit) {
      const allItems = await this.prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      return allItems;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return {
      items,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteOne(id: string) {
    const found = await this.prisma.complaint.findUnique({ where: { id } });
    if (!found) return null;
    return this.prisma.complaint.delete({ where: { id } });
  }

  async deleteMany(ids: string[]) {
    return this.prisma.complaint.deleteMany({ where: { id: { in: ids } } });
  }

  async restoreComplaint(data: any) {
    return this.prisma.complaint.create({
      data: {
        ...data,
        id: data.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      },
    });
  }

  async updateComplaint(id: string, data: any) {
    const found = await this.prisma.complaint.findUnique({ where: { id } });
    if (!found) return null;
    return this.prisma.complaint.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }
}
