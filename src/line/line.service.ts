import { Injectable, NotFoundException } from '@nestjs/common';
import { ComplaintService } from '../complaint/complaint.service';
import { randomUUID } from 'crypto';
import axios from 'axios';
import { StorageService } from '../storage/storage.service';
import { ComplaintStatus } from '@prisma/client';
import * as path from 'path';

@Injectable()
export class LineService {
    constructor(
        private complaintService: ComplaintService,
        private storageService: StorageService,
    ) { }

    async handleWebhook(body: any) {
        const events = body.events;
        setTimeout(() => {
            this.processEvents(events);
        }, 0);
        return { status: 'ok' };
    }

    private async processEvents(events: any[]) {
        for (const event of events) {
            console.log('🪵 LINE Event Received:', JSON.stringify(event, null, 2));
            const lineUserId = event.source?.userId;

            if (event.type === 'message' && event.message.type === 'text') {
                const description = event.message.text;
                const complaint = await this.complaintService.createComplaint({
                    lineUserId,
                    description,
                    imageBefore: 'https://via.placeholder.com/400x300.png?text=รอ+แนบรูป',
                });

                await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, {
                    type: 'text',
                    text: `📌 เรื่องร้องเรียนใหม่
🧾 ID: ${complaint.id}
👤 ผู้แจ้ง: ${lineUserId}
📝 รายละเอียด: ${description}
📎 แนบรูป: ${complaint.imageBefore}`,
                });

                await this.replyToUser(event.replyToken, {
                    type: 'text',
                    text: `📬 ระบบได้รับเรื่องร้องเรียนของคุณแล้ว ขอบคุณมากครับ 🙏\nหมายเลขอ้างอิง: ${complaint.id}`,
                });
            }

            if (event.type === 'message' && event.message.type === 'image') {
                const messageId = event.message.id;
                const headers = { Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}` };

                try {
                    const imageResponse = await axios.get(
                        `https://api-data.line.me/v2/bot/message/${messageId}/content`,
                        { headers, responseType: 'arraybuffer', validateStatus: () => true },
                    );

                    console.log('📸 LINE image debug');
                    console.log('🔹 messageId:', messageId);
                    console.log('🔹 response status:', imageResponse.status);
                    console.log('🔹 response content-type:', imageResponse.headers['content-type']);
                    console.log('🔹 content length:', imageResponse.data?.length);

                    if (!imageResponse.headers['content-type']?.startsWith('image/')) {
                        console.error('❌ LINE image API response is not image:', imageResponse.status);
                        return;
                    }

                    const buffer = Buffer.from(imageResponse.data, 'binary');
                    const filename = `line-${randomUUID()}.jpg`;
                    console.log('📤 Uploading image to Supabase...');
                    const imageUrl = await this.storageService.uploadImage(buffer, filename);
                    console.log('✅ Uploaded image URL:', imageUrl);

                    const complaint = await this.complaintService.createComplaint({
                        lineUserId,
                        description: 'ภาพจากผู้ใช้ LINE',
                        imageBefore: imageUrl,
                    });

                    await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, {
                        type: 'text',
                        text: `📌 เรื่องร้องเรียนใหม่ (แนบภาพ)
🧾 ID: ${complaint.id}
👤 ผู้แจ้ง: ${lineUserId}
📎 แนบรูป: ${imageUrl}`,
                    });

                    await this.replyToUser(event.replyToken, {
                        type: 'text',
                        text: `📬 ระบบได้รับภาพร้องเรียนของคุณแล้ว ขอบคุณครับ 🙏\nหมายเลขอ้างอิง: ${complaint.id}`,
                    });
                } catch (err) {
                    console.error('❌ Failed to upload image:', err.message);
                    if (err.response) {
                        console.error('📦 Upload error status:', err.response.status);
                        console.error('📦 Upload error headers:', err.response.headers);
                    }
                }
            }
        }
    }

    async notifyGroupAboutComplaint(id: string) {
        const complaint = await this.complaintService.findById(id);
        if (!complaint) throw new NotFoundException('Complaint not found');

        const message = {
            type: 'text',
            text: `📌 เรื่องร้องเรียนใหม่ (จากฟอร์ม)\n🧾 ID: ${complaint.id}\n👤 ผู้แจ้ง: ${complaint.lineUserId}\n📝 รายละเอียด: ${complaint.description}\n📍 ตำแหน่ง: ${complaint.location || 'ไม่ระบุ'}\n📎 รูป: ${complaint.imageBefore}`,
        };

        await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, message);
        return { message: 'ส่งข้อความแจ้งไปยังกลุ่มแล้ว' };
    }

    async updateComplaintStatus(id: string, status: string) {
        const updated = await this.complaintService.updateStatus(id, status as ComplaintStatus);
        const userId = updated.lineUserId;

        if (userId && status === 'RESOLVED') {
            await this.pushMessageToUser(userId, {
                type: 'text',
                text: `✅ ปัญหาของคุณได้รับการดำเนินการเรียบร้อยแล้วครับ 🙌\nขอบคุณที่แจ้งเรื่องมานะครับ!`,
            });
        }

        return updated;
    }

    async pushMessageToGroup(groupId: string, message: any) {
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
        };
        await axios.post('https://api.line.me/v2/bot/message/push', { to: groupId, messages: [message] }, { headers });
    }

    async replyToUser(replyToken: string, message: any) {
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
        };
        await axios.post('https://api.line.me/v2/bot/message/reply', { replyToken, messages: [message] }, { headers });
    }

    async pushMessageToUser(userId: string, message: any) {
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
        };
        await axios.post('https://api.line.me/v2/bot/message/push', { to: userId, messages: [message] }, { headers });
    }

    async uploadImageAfter(id: string, file?: Express.Multer.File) {
        let imageUrl: string | undefined;
        if (file) {
            const buffer = file.buffer;
            const extension = path.extname(file.originalname) || '.jpg';
            const filename = `after-${randomUUID()}${extension}`;
            imageUrl = await this.storageService.uploadImage(buffer, filename);
        }
        await this.complaintService.updateImageAfter(id, imageUrl);

        const complaint = await this.complaintService.findById(id);
        if (complaint?.lineUserId) {
            const messages: any[] = [
                {
                    type: 'text',
                    text: '📌 การดำเนินการของคุณเสร็จสมบูรณ์แล้ว ขอบคุณที่แจ้งเรื่องเข้ามาครับ 🙏',
                },
            ];

            if (imageUrl) {
                messages.push({
                    type: 'image',
                    originalContentUrl: imageUrl,
                    previewImageUrl: imageUrl,
                });
            }

            await axios.post(
                'https://api.line.me/v2/bot/message/push',
                {
                    to: complaint.lineUserId,
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

        return {
            message: 'ดำเนินการอัปเดตสำเร็จ',
            ...(imageUrl && { imageUrl }),
        };
    }
}