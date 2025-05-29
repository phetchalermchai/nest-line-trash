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
  ) {}

  async notifyGroupAboutComplaint(id: string) {
    const c = await this.complaintService.findById(id);
    if (!c) throw new NotFoundException('Complaint not found');

    const lineDisplayName = c.lineDisplayName || c.lineUserId;
    const mapUrl = c.location ? `https://www.google.com/maps?q=${c.location}` : 'ไม่ระบุ';

    const flexMessage = {
      type: 'flex',
      altText: 'เรื่องร้องเรียนใหม่',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'md',
          contents: [
            { type: 'text', text: `📌 เรื่องร้องเรียนใหม่ : ${c.id}`, weight: 'bold', size: 'md' },
            { type: 'text', text: `👤 ผู้แจ้ง: ${lineDisplayName}`, wrap: true },
            { type: 'text', text: `📞 เบอร์ติดต่อ: ${c.phone || 'ไม่ระบุ'}`, wrap: true },
            { type: 'text', text: `📝 รายละเอียด: ${c.description}`, wrap: true },
            { type: 'text', text: `📍 พิกัด:`, wrap: true },
            { type: 'text', text: mapUrl, size: 'xs', color: '#555555', wrap: true },
          ],
        },
        footer: {
          type: 'box',
          layout: 'horizontal',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              action: {
                type: 'uri',
                label: '📄 รายละเอียดเพิ่มเติม',
                uri: `https://next-line-trash.vercel.app/admin/complaints/${c.id}`,
              },
            },
            {
              type: 'button',
              style: 'secondary',
              action: {
                type: 'uri',
                label: '📌 แจ้งผลการดำเนินงาน',
                uri: `https://next-line-trash.vercel.app/admin/complaints/${c.id}/report`,
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
              type: 'text',
              text: `📍 พิกัด:`,
              wrap: true,
            },
            {
              type: 'text',
              text: mapUrl,
              size: 'xs',
              color: '#555555',
              wrap: true,
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'button',
              style: 'primary',
              action: {
                type: 'uri',
                label: '📄 รายละเอียดเพิ่มเติม',
                uri: `https://next-line-trash.vercel.app/complaints/${c.id}`,
              },
            },
          ],
        },
      },
    };

    await this.pushMessageToUser(c.lineUserId, [userMessage]);

    return { message: 'ส่งข้อความเข้า group และตอบกลับผู้แจ้งเรียบร้อย' };
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