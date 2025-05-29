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
            altText: '📌 เรื่องร้องเรียนใหม่',
            contents: {
                type: 'bubble',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'text',
                            text: `📌 เรื่องร้องเรียน ${c.id.slice(0, 8)}...`,
                            weight: 'bold',
                            size: 'md',
                            wrap: true,
                        },
                        {
                            type: 'text',
                            text: `👤 ผู้แจ้ง: ${lineDisplayName}`,
                            size: 'sm',
                            color: '#555555',
                            wrap: true,
                        },
                        {
                            type: 'text',
                            text: `📞 เบอร์: ${c.phone || 'ไม่ระบุ'}`,
                            size: 'sm',
                            color: '#555555',
                            wrap: true,
                        },
                        {
                            type: 'text',
                            text: `📝 ${c.description}`,
                            size: 'sm',
                            color: '#111111',
                            wrap: true,
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
                            style: 'link',
                            height: 'sm',
                            action: {
                                type: 'uri',
                                label: '📍 เปิดแผนที่',
                                uri: mapUrl,
                            },
                        },
                        {
                            type: 'button',
                            style: 'primary',
                            height: 'sm',
                            action: {
                                type: 'uri',
                                label: '📄 ดูรายละเอียด',
                                uri: `${process.env.WEB_BASE_URL}/admin/complaints/${c.id}`,
                            },
                        },
                        {
                            type: 'button',
                            style: 'secondary',
                            height: 'sm',
                            action: {
                                type: 'uri',
                                label: '📌 แจ้งผล',
                                uri: `${process.env.WEB_BASE_URL}/admin/complaints/${c.id}/report`,
                            },
                        },
                        {
                            type: 'spacer',
                            size: 'sm',
                        },
                    ],
                    flex: 0,
                },
            },
        };

        await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, [flexMessage]);

        const userMessage = {
            type: 'flex',
            altText: '📬 ระบบได้รับเรื่องร้องเรียนของคุณแล้ว',
            contents: {
                type: 'bubble',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'text',
                            text: `📌 เรื่องร้องเรียน ${c.id.slice(0, 8)}...`,
                            weight: 'bold',
                            size: 'md',
                            wrap: true,
                        },
                        {
                            type: 'text',
                            text: '📬 ระบบได้รับเรื่องร้องเรียนของคุณแล้ว ขอบคุณมากครับ 🙏',
                            size: 'sm',
                            wrap: true,
                        },
                        {
                            type: 'text',
                            text: `📝 ${c.description}`,
                            size: 'sm',
                            color: '#111111',
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
                    spacing: 'sm',
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
                        {
                            type: 'spacer',
                            size: 'sm',
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
            altText: '📮 ผลการดำเนินงานของคุณ',
            contents: {
                type: 'bubble',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'text',
                            text: `📌 เรื่องร้องเรียน ${c.id.slice(0, 8)}...`,
                            weight: 'bold',
                            size: 'md',
                            wrap: true,
                        },
                        {
                            type: 'text',
                            text: '📮 เรื่องร้องเรียนของคุณได้รับการดำเนินการแล้ว ✅',
                            size: 'sm',
                            wrap: true,
                        },
                        ...(message ? [{
                            type: 'text',
                            text: `📄 สรุปผล: ${message}`,
                            size: 'sm',
                            wrap: true,
                        }] : []),
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
                                label: '📄 ดูรายละเอียด',
                                uri: `${process.env.WEB_BASE_URL}/complaints/${c.id}`,
                            },
                        },
                    ],
                },
            },
        };

        await this.pushMessageToUser(c.lineUserId, [userFlex]);

        const resultFlex = {
            type: 'flex',
            altText: `📌 เรื่อง ID ${id} ดำเนินการเสร็จแล้ว`,
            contents: {
                type: 'bubble',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'text',
                            text: `📌 เรื่อง ID ${id.slice(0, 8)}... ดำเนินการเสร็จแล้ว ✅`,
                            weight: 'bold',
                            wrap: true,
                        },
                        ...(message ? [{
                            type: 'text',
                            text: `📄 สรุปผล: ${message}`,
                            wrap: true,
                        }] : []),
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
                                uri: `${process.env.WEB_BASE_URL}/admin/complaints/${c.id}`,
                            },
                        },
                    ],
                },
            },
        };

        await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, [resultFlex]);

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