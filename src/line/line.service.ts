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

        // 1. ข้อความหลัก
        const textMsg = {
            type: 'text',
            text: `📌 เรื่องร้องเรียนใหม่\n🧾 ID: ${c.id}\n👤 ผู้แจ้ง: ${c.lineUserId}\n📝: ${c.description}\n📍: ${c.location || 'ไม่ระบุ'}`,
        };

        // 2. แปลง imageBefore ให้เป็น array
        const urls = c.imageBefore.split(',').filter(u => u.trim());
        // 3. สร้าง messages array
        const messages: any[] = [textMsg];
        urls.forEach(url => {
            messages.push({
                type: 'image',
                originalContentUrl: url,
                previewImageUrl: url,
            });
        });

        // 4. ส่งทีเดียว
        await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, messages);
        return { message: 'ส่งข้อความเข้า group เรียบร้อย' };
    }

    async updateComplaintStatus(id: string, status: string) {
        const updated = await this.complaintService.updateStatus(id, status as ComplaintStatus);
        // เช็ค enum ให้ตรง
        if (updated.lineUserId && status === ComplaintStatus.DONE) {
            await this.pushMessageToUser(updated.lineUserId, {
                type: 'text',
                text: `✅ เรื่องของคุณดำเนินการเสร็จแล้ว ID: ${updated.id}`,
            });
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
        // อัปเดตสถานะใน DB
        await this.complaintService.updateImageAfter(id, imageUrl);
        const c = await this.complaintService.findById(id);

        // แจ้ง user
        if (c?.lineUserId) {
            const messages: any[] = [{
                type: 'text',
                text: '📌 การดำเนินการของคุณเสร็จสมบูรณ์ ขอบคุณครับ',
            }];
            if (imageUrl) {
                messages.push({
                    type: 'image',
                    originalContentUrl: imageUrl,
                    previewImageUrl: imageUrl,
                });
            }
            // ไล่ส่งทีละข้อความ
            for (const m of messages) {
                await this.pushMessageToUser(c.lineUserId, m);
            }
        }

        // แจ้ง group ด้วย
        await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, {
            type: 'text',
            text: `📌 เรื่อง ID ${id} ดำเนินการเสร็จแล้ว`,
        });

        return { message: 'อัปเดตและแจ้งเรียบร้อย', ...(imageUrl && { imageUrl }) };
    }

    private async pushMessageToGroup(groupId: string, message: any) {
        await axios.post(
            'https://api.line.me/v2/bot/message/push',
            { to: groupId, messages: [message] },
            { headers: { Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } },
        );
    }

    private async pushMessageToUser(userId: string, message: any) {
        await axios.post(
            'https://api.line.me/v2/bot/message/push',
            { to: userId, messages: [message] },
            { headers: { Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } },
        );
    }
}
