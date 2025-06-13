import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Complaint, ComplaintStatus, ComplaintSource, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ComplaintService {
  constructor(private prisma: PrismaService, private storage: StorageService) { }

  async createComplaint(data: {
    source: ComplaintSource;
    receivedBy?: string;
    reporterName?: string;
    lineUserId?: string;
    phone?: string;
    description: string;
    imageBefore?: string;
    location?: string;
  }) {
    return this.prisma.complaint.create({
      data: {
        source: data.source,
        receivedBy: data.receivedBy,
        reporterName: data.reporterName,
        lineUserId: data.lineUserId,
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

  async updateImageAfter(id: string, imageAfter?: string) {
    return this.prisma.complaint.update({
      where: { id },
      data: {
        imageAfter: imageAfter ?? undefined,
        status: "DONE",
        message: undefined,
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
          { reporterName: { contains: search, mode: 'insensitive' } },
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

  async deleteOne(id: string): Promise<boolean> {
    const found = await this.prisma.complaint.findUnique({ where: { id } });
    if (!found) return false;

    // ลบรูปภาพที่เกี่ยวข้อง (imageBefore + imageAfter)
    const allImageUrls = [
      ...(found.imageBefore?.split(",") || []),
      ...(found.imageAfter?.split(",") || []),
    ];

    for (const url of allImageUrls) {
      try {
        await this.storage.deleteImage(url);
      } catch (err) {
        console.error("ลบภาพล้มเหลว:", url, err);
        // ดำเนินการลบต่อไปแม้บางไฟล์จะลบไม่ได้
      }
    }

    // ลบข้อมูลจากฐานข้อมูล
    await this.prisma.complaint.delete({ where: { id } });
    return true;
  }

  async deleteMany(ids: string[]): Promise<void> {
    const complaints = await this.prisma.complaint.findMany({
      where: { id: { in: ids } },
    });

    for (const complaint of complaints) {
      const imageUrls = [
        ...(complaint.imageBefore?.split(',') || []),
        ...(complaint.imageAfter?.split(',') || []),
      ];

      for (const url of imageUrls) {
        try {
          await this.storage.deleteImage(url);
        } catch (err) {
          console.warn(`ลบภาพล้มเหลว: ${url}`, err);
        }
      }
    }

    await this.prisma.complaint.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restoreComplaint(data: any) {
    return this.prisma.complaint.create({
      data: {
        ...data,
        id: data.id,
        imageBefore: "",
        imageAfter: "",
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      },
    });
  }

  async updateComplaint(id: string, data: any): Promise<Complaint> {
    const found = await this.prisma.complaint.findUnique({ where: { id } });

    if (!found) {
      throw new NotFoundException(`ไม่พบรายการร้องเรียนที่มี ID: ${id}`);
    }

    const updateData: any = {
      phone: data.phone,
      description: data.description,
      message: data.message,
      status: data.status,
      location: data.location,
      updatedAt: new Date(),
    };

    if (data.source) updateData.source = data.source;
    if (data.receivedBy) updateData.receivedBy = data.receivedBy;
    if (data.reporterName) updateData.reporterName = data.reporterName;

    if ('message' in data) {
      updateData.message = data.message?.trim() || "";
    }

    if ('receivedBy' in data) {
      updateData.receivedBy = data.receivedBy?.trim() || "";
    }

    if ('reporterName' in data) {
      updateData.reporterName = data.reporterName?.trim() || "";
    }

    // === Helper ฟังก์ชัน ===
    const handleImageUpdate = async (
      field: "imageBefore" | "imageAfter",
      files: Express.Multer.File[] | undefined,
      oldValue: string | null | undefined
    ): Promise<string> => {
      const oldUrls = oldValue?.split(",") ?? [];
      const keepUrls = (data[field]?.split(",") ?? [])
        .map((s: string) => s.trim())
        .filter((url: string) => url && oldUrls.includes(url));

      const uploadedUrls: string[] = [];
      if (files?.length) {
        for (const file of files) {
          const ext = file.originalname.split(".").pop();
          const filename = `before-${id}-${randomUUID()}.${ext}`;
          const url = await this.storage.uploadImage(file.buffer, filename);
          uploadedUrls.push(url);
        }
      }

      const deleteUrls = oldUrls.filter((url) => !keepUrls.includes(url));
      for (const url of deleteUrls) {
        await this.storage.deleteImage(url);
      }

      return [...keepUrls, ...uploadedUrls]
        .filter(Boolean)
        .join(",");
    };

    // === จัดการรูปภาพ ===
    updateData.imageBefore = await handleImageUpdate(
      "imageBefore",
      data.imageBeforeFiles,
      found.imageBefore
    );

    updateData.imageAfter = await handleImageUpdate(
      "imageAfter",
      data.imageAfterFiles,
      found.imageAfter
    );

    // === อัปเดตฐานข้อมูล ===
    return this.prisma.complaint.update({
      where: { id },
      data: updateData,
    });
  }

}
