import { Injectable, NotFoundException } from '@nestjs/common';
import { ComplaintService } from '../complaint/complaint.service';
import { StorageService } from '../storage/storage.service';
import axios from 'axios';
import { ComplaintStatus } from '@prisma/client';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class LineService {
    constructor(
        private complaintService: ComplaintService,
        private storageService: StorageService,
    ) { }

    async notifyGroupAboutComplaint(id: string) {
        const c = await this.complaintService.findById(id);
        if (!c) throw new NotFoundException('Complaint not found');

        // 1. ข้อความหลักส่งเข้า group
        const textMsg = {
            type: 'text',
            text: `📌 เรื่องร้องเรียนใหม่\n🧾 ID: ${c.id}\n👤 ผู้แจ้ง: ${c.lineUserId}\n📝: ${c.description}\n📍: ${c.location || 'ไม่ระบุ'}`,
        };

        const urls = c.imageBefore.split(',').filter((u) => u.trim());
        const messages: any[] = [textMsg];

        urls.forEach((url) => {
            messages.push({
                type: 'image',
                originalContentUrl: url,
                previewImageUrl: url,
            });
        });

        // ✅ ส่งเข้า LINE group
        await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, messages);

        // ✅ ตอบกลับผู้แจ้งว่าได้รับเรื่องแล้ว
        await this.pushMessageToUser(c.lineUserId, [
            {
                type: 'text',
                text: `📬 ระบบได้รับเรื่องร้องเรียนของคุณแล้ว ขอบคุณมากครับ 🙏\nหมายเลขอ้างอิง: ${c.id}`,
            },
        ]);

        return { message: 'ส่งข้อความเข้า group และตอบกลับผู้แจ้งเรียบร้อย' };
    }

    async updateComplaintStatus(id: string, status: string) {
        const updated = await this.complaintService.updateStatus(id, status as ComplaintStatus);

        if (updated.lineUserId && status === ComplaintStatus.DONE) {
            await this.pushMessageToUser(updated.lineUserId, [
                {
                    type: 'text',
                    text: `✅ เรื่องของคุณดำเนินการเสร็จแล้ว ID: ${updated.id}`,
                },
            ]);
        }

        return updated;
    }

    async uploadImageAfter(id: string, file?: Express.Multer.File) {
        let imageUrl: string | undefined;

        if (file) {
            const ext = path.extname(file.originalname) || '.jpg';
            const filename = `after-${randomUUID()}${ext}`;
            imageUrl = await this.storageService.uploadImage(file.buffer, filename);
        }

        await this.complaintService.updateImageAfter(id, imageUrl);
        const c = await this.complaintService.findById(id);

        if (c?.lineUserId) {
            const messages: any[] = [
                {
                    type: 'text',
                    text: '📌 การดำเนินการของคุณเสร็จสมบูรณ์ ขอบคุณครับ',
                },
            ];

            if (imageUrl) {
                messages.push({
                    type: 'image',
                    originalContentUrl: imageUrl,
                    previewImageUrl: imageUrl,
                });
            }

            await this.pushMessageToUser(c.lineUserId, messages);
        }

        await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, [
            {
                type: 'text',
                text: `📌 เรื่อง ID ${id} ดำเนินการเสร็จแล้ว`,
            },
        ]);

        return { message: 'อัปเดตและแจ้งเรียบร้อย', ...(imageUrl && { imageUrl }) };
    }

    // ✅ ส่ง array ตรง ๆ ไม่ซ้อน
    private async pushMessageToGroup(groupId: string, messages: any[]) {
        await axios.post(
            'https://api.line.me/v2/bot/message/push',
            {
                to: groupId,
                messages,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            },
        );
    }

    private async pushMessageToUser(userId: string, messages: any[]) {
        await axios.post(
            'https://api.line.me/v2/bot/message/push',
            {
                to: userId,
                messages,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            },
        );
    }
}
