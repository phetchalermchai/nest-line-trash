import { Injectable, NotFoundException } from '@nestjs/common';
import { ComplaintService } from '../complaint/complaint.service';
import { StorageService } from '../storage/storage.service';
import axios from 'axios';
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

        const lineDisplayName = c.lineDisplayName || c.lineUserId;
        const mapUrl = c.location
            ? `https://www.google.com/maps/search/?api=1&query=${c.location}`
            : 'https://www.google.com/maps';

        const flexMessage = {
            type: 'flex',
            altText: 'เรื่องร้องเรียนใหม่',
            contents: {
                type: 'bubble',
                size: 'mega',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'md',
                    contents: [
                        { type: 'text', text: `📌 เรื่องร้องเรียนใหม่ : ${c.id}`, weight: 'bold', size: 'lg' },
                        { type: 'text', text: `👤 ผู้แจ้ง: ${lineDisplayName}`, wrap: true },
                        { type: 'text', text: `📞 เบอร์ติดต่อ: ${c.phone || 'ไม่ระบุ'}`, wrap: true },
                        { type: 'text', text: `📝 รายละเอียด: ${c.description}`, wrap: true },
                        {
                            type: 'button',
                            style: 'link',
                            action: {
                                type: 'uri',
                                label: '📍 เปิดแผนที่',
                                uri: mapUrl,
                            },
                        },
                    ],
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'button',
                            style: 'primary',
                            action: {
                                type: 'uri',
                                label: '📄 หน้าผู้แจ้ง (public)',
                                uri: `${process.env.WEB_BASE_URL}/complaints/${c.id}`,
                            },
                        },
                        {
                            type: 'button',
                            style: 'secondary',
                            action: {
                                type: 'uri',
                                label: '📌 แจ้งผลการดำเนินงาน',
                                uri: `${process.env.WEB_BASE_URL}/admin/complaints/${c.id}/report`,
                            },
                        },
                    ],
                },
            },
        };

        await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, [flexMessage]);

        const userMessage = {
            type: 'flex',
            altText: 'ยืนยันการรับเรื่องร้องเรียน',
            contents: {
                type: 'bubble',
                size: 'mega',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'md',
                    contents: [
                        {
                            type: 'text',
                            text: '📬 ระบบได้รับเรื่องร้องเรียนของคุณแล้ว ขอบคุณมากครับ 🙏',
                            wrap: true,
                        },
                        {
                            type: 'text',
                            text: `หมายเลขอ้างอิง: ${c.id}`,
                            size: 'sm',
                            wrap: true,
                        },
                        {
                            type: 'text',
                            text: `📝 รายละเอียด: ${c.description}`,
                            wrap: true,
                        },
                        {
                            type: 'button',
                            style: 'link',
                            action: {
                                type: 'uri',
                                label: '📍 เปิดแผนที่',
                                uri: mapUrl,
                            },
                        },
                    ],
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'button',
                            style: 'primary',
                            action: {
                                type: 'uri',
                                label: '📄 รายละเอียดเพิ่มเติม',
                                uri: `${process.env.WEB_BASE_URL}/complaints/${c.id}`,
                            },
                        },
                    ],
                },
            },
        };

        await this.pushMessageToUser(c.lineUserId, [userMessage]);

        return { message: 'ส่งข้อความเข้า group และตอบกลับผู้แจ้งเรียบร้อย' };
    }

    async uploadImageAfter(id: string, file?: Express.Multer.File, message?: string) {
        let imageUrl: string | undefined;

        if (file) {
            const ext = path.extname(file.originalname) || '.jpg';
            const filename = `after-${randomUUID()}${ext}`;
            imageUrl = await this.storageService.uploadImage(file.buffer, filename);
        }

        await this.complaintService.updateImageAfter(id, imageUrl);
        const c = await this.complaintService.findById(id);
        if (!c || !c.lineUserId) return;

        const mapUrl = c.location
            ? `https://www.google.com/maps/search/?api=1&query=${c.location}`
            : 'https://www.google.com/maps';

        const userFlex = {
            type: 'flex',
            altText: 'ผลการดำเนินงานของคุณ',
            contents: {
                type: 'bubble',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'md',
                    contents: [
                        { type: 'text', text: '📮 เรื่องร้องเรียนของคุณได้รับการดำเนินการแล้ว ✅', wrap: true },
                        { type: 'text', text: `หมายเลขอ้างอิง: ${c.id}`, size: 'sm', wrap: true },
                        {
                            type: 'button',
                            style: 'link',
                            action: {
                                type: 'uri',
                                label: '📍 เปิดแผนที่',
                                uri: mapUrl,
                            },
                        },
                        ...(message ? [{ type: 'text', text: `📄 สรุปผล: ${message}`, wrap: true }] : []),
                    ],
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'button',
                            style: 'primary',
                            action: {
                                type: 'uri',
                                label: '📄 ดูรายละเอียด',
                                uri: `${process.env.WEB_BASE_URL}/complaints/${c.id}`,
                            },
                        },
                    ],
                },
            },
        };

        await this.pushMessageToUser(c.lineUserId, [userFlex]);

        await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, [
            {
                type: 'text',
                text: `📌 เรื่อง ID ${id} ดำเนินการเสร็จแล้ว\n${message || ''}`.trim(),
            },
        ]);

        return { message: 'อัปเดตและแจ้งเรียบร้อย', ...(imageUrl && { imageUrl }) };
    }

    private async pushMessageToGroup(groupId: string, messages: any[]) {
        await axios.post(
            'https://api.line.me/v2/bot/message/push',
            { to: groupId, messages },
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
            { to: userId, messages },
            {
                headers: {
                    Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            },
        );
    }
}