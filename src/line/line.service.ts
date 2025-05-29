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
                    contents: [
                        {
                            type: 'text',
                            text: '📌 เรื่องร้องเรียน (ใหม่)',
                            weight: 'bold',
                            size: 'xl'
                        },
                        {
                            type: 'box',
                            layout: 'vertical',
                            margin: 'lg',
                            spacing: 'sm',
                            contents: [
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'ID',
                                            color: '#aaaaaa',
                                            size: 'sm',
                                            flex: 2
                                        },
                                        {
                                            type: 'text',
                                            text: c.id,
                                            wrap: true,
                                            color: '#666666',
                                            size: 'sm',
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'ผู้แจ้ง',
                                            color: '#aaaaaa',
                                            size: 'sm',
                                            flex: 2
                                        },
                                        {
                                            type: 'text',
                                            text: lineDisplayName,
                                            wrap: true,
                                            color: '#666666',
                                            size: 'sm',
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'เบอร์',
                                            color: '#aaaaaa',
                                            size: 'sm',
                                            flex: 2
                                        },
                                        {
                                            type: 'text',
                                            text: c.phone || 'ไม่ระบุ',
                                            wrap: true,
                                            color: '#666666',
                                            size: 'sm',
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'รายละเอียด',
                                            color: '#aaaaaa',
                                            size: 'sm',
                                            flex: 2
                                        },
                                        {
                                            type: 'text',
                                            text: c.description,
                                            wrap: true,
                                            color: '#666666',
                                            size: 'sm',
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'พิกัด',
                                            size: 'sm',
                                            color: '#aaaaaa',
                                            flex: 2
                                        },
                                        {
                                            type: 'text',
                                            text: 'เปิดใน Google Maps',
                                            flex: 5,
                                            size: 'sm',
                                            color: '#155dfc',
                                            action: {
                                                type: 'uri',
                                                label: 'action',
                                                uri: mapUrl,
                                                altUri: {
                                                    desktop: mapUrl
                                                }
                                            },
                                            decoration: 'underline'
                                        }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'สถานะ',
                                            flex: 2,
                                            size: 'sm',
                                            color: '#aaaaaa'
                                        },
                                        {
                                            type: 'text',
                                            text: 'รอดำเนินการ',
                                            flex: 5,
                                            size: 'sm',
                                            color: '#666666'
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'button',
                            style: 'primary',
                            height: 'sm',
                            action: {
                                type: 'uri',
                                label: 'ดูรายละเอียด',
                                uri: `${process.env.WEB_BASE_URL}/admin/complaints/${c.id}`
                            }
                        },
                        {
                            type: 'button',
                            style: 'secondary',
                            height: 'sm',
                            action: {
                                type: 'uri',
                                label: 'แจ้งผลดำเนินงาน',
                                uri: `${process.env.WEB_BASE_URL}/admin/complaints/${c.id}/report`
                            }
                        }
                    ],
                    flex: 0
                }
            }
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
                    contents: [
                        {
                            type: 'text',
                            text: '📌 เรื่องร้องเรียน',
                            weight: 'bold',
                            size: 'xl'
                        },
                        {
                            type: 'box',
                            layout: 'vertical',
                            margin: 'lg',
                            spacing: 'sm',
                            contents: [
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'ID',
                                            color: '#aaaaaa',
                                            size: 'sm',
                                            flex: 2
                                        },
                                        {
                                            type: 'text',
                                            text: c.id,
                                            wrap: true,
                                            color: '#666666',
                                            size: 'sm',
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'ผู้แจ้ง',
                                            color: '#aaaaaa',
                                            size: 'sm',
                                            flex: 2
                                        },
                                        {
                                            type: 'text',
                                            text: lineDisplayName,
                                            wrap: true,
                                            color: '#666666',
                                            size: 'sm',
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'เบอร์',
                                            color: '#aaaaaa',
                                            size: 'sm',
                                            flex: 2
                                        },
                                        {
                                            type: 'text',
                                            text: c.phone || 'ไม่ระบุ',
                                            wrap: true,
                                            color: '#666666',
                                            size: 'sm',
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'รายละเอียด',
                                            color: '#aaaaaa',
                                            size: 'sm',
                                            flex: 2
                                        },
                                        {
                                            type: 'text',
                                            text: c.description,
                                            wrap: true,
                                            color: '#666666',
                                            size: 'sm',
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'พิกัด',
                                            size: 'sm',
                                            color: '#aaaaaa',
                                            flex: 2
                                        },
                                        {
                                            type: 'text',
                                            text: 'เปิดใน Google Maps',
                                            flex: 5,
                                            size: 'sm',
                                            color: '#155dfc',
                                            action: {
                                                type: 'uri',
                                                label: 'action',
                                                uri: mapUrl,
                                                altUri: {
                                                    desktop: mapUrl
                                                }
                                            },
                                            decoration: 'underline'
                                        }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'สถานะ',
                                            flex: 2,
                                            size: 'sm',
                                            color: '#aaaaaa'
                                        },
                                        {
                                            type: 'text',
                                            text: 'รอดำเนินการ',
                                            flex: 5,
                                            size: 'sm',
                                            color: '#666666'
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            type: 'separator',
                            margin: 'md'
                        },
                        {
                            type: 'box',
                            layout: 'baseline',
                            contents: [
                                {
                                    type: 'text',
                                    text: 'ระบบได้รับเรื่องร้องเรียนของคุณแล้ว',
                                    wrap: true,
                                    weight: 'bold',
                                    align: 'center'
                                }
                            ],
                            margin: 'lg'
                        }
                    ]
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'button',
                            style: 'primary',
                            height: 'sm',
                            action: {
                                type: 'uri',
                                label: 'ดูรายละเอียด',
                                uri: `${process.env.WEB_BASE_URL}/complaints/${c.id}`
                            }
                        }
                    ],
                    flex: 0
                }
            }
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
                    contents: [
                        {
                            type: 'text',
                            text: '📌 เรื่องร้องเรียน (สำเร็จ)',
                            weight: 'bold',
                            size: 'xl'
                        },
                        {
                            type: 'box',
                            layout: 'vertical',
                            margin: 'lg',
                            spacing: 'sm',
                            contents: [
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        { type: 'text', text: 'ID', color: '#aaaaaa', size: 'sm', flex: 2 },
                                        { type: 'text', text: c.id, color: '#666666', size: 'sm', wrap: true, flex: 5 }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        { type: 'text', text: 'ผู้แจ้ง', color: '#aaaaaa', size: 'sm', flex: 2 },
                                        { type: 'text', text: c.lineDisplayName, color: '#666666', size: 'sm', wrap: true, flex: 5 }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        { type: 'text', text: 'เบอร์', color: '#aaaaaa', size: 'sm', flex: 2 },
                                        { type: 'text', text: c.phone || 'ไม่ระบุ', color: '#666666', size: 'sm', wrap: true, flex: 5 }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        { type: 'text', text: 'รายละเอียด', color: '#aaaaaa', size: 'sm', flex: 2 },
                                        { type: 'text', text: c.description, color: '#666666', size: 'sm', wrap: true, flex: 5 }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    contents: [
                                        { type: 'text', text: 'พิกัด', size: 'sm', color: '#aaaaaa', flex: 2 },
                                        {
                                            type: 'text',
                                            text: 'เปิดใน Google Maps',
                                            size: 'sm',
                                            color: '#155dfc',
                                            flex: 5,
                                            action: {
                                                type: 'uri',
                                                label: 'action',
                                                uri: mapUrl,
                                                altUri: { desktop: mapUrl }
                                            },
                                            decoration: 'underline'
                                        }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    contents: [
                                        { type: 'text', text: 'สถานะ', size: 'sm', color: '#aaaaaa', flex: 2 },
                                        { type: 'text', text: 'ดำเนินการเสร็จแล้ว', size: 'sm', color: '#666666', flex: 5 }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: 'สรุปผล',
                                            size: 'sm',
                                            flex: 2,
                                            color: '#aaaaaa'
                                        },
                                        {
                                            type: 'text',
                                            text: message || 'ไม่ระบุ',
                                            flex: 5,
                                            size: 'sm',
                                            color: '#666666'
                                        }
                                    ]
                                }
                            ]
                        },
                        { type: 'separator', margin: 'md' },
                        {
                            type: 'box',
                            layout: 'baseline',
                            contents: [
                                {
                                    type: 'text',
                                    text: 'เรื่องร้องเรียนของคุณได้รับการดำเนินการแล้ว',
                                    weight: 'bold',
                                    align: 'center',
                                    wrap: true
                                }
                            ],
                            margin: 'lg'
                        }
                    ]
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'button',
                            style: 'primary',
                            height: 'sm',
                            action: {
                                type: 'uri',
                                label: 'ดูรายละเอียด',
                                uri: `${process.env.WEB_BASE_URL}/complaints/${c.id}`
                            }
                        }
                    ],
                    flex: 0
                }
            }
        };

        await this.pushMessageToUser(c.lineUserId, [userFlex]);

        const resultFlex = {
            type: 'flex',
            altText: `📌 เรื่อง ID ${c.id.slice(0, 8)}... ดำเนินการเสร็จแล้ว`,
            contents: {
                type: 'bubble',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: '📌 เรื่องร้องเรียน (สำเร็จ)',
                            weight: 'bold',
                            size: 'xl'
                        },
                        {
                            type: 'box',
                            layout: 'vertical',
                            margin: 'lg',
                            spacing: 'sm',
                            contents: [
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        { type: 'text', text: 'ID', color: '#aaaaaa', size: 'sm', flex: 2 },
                                        { type: 'text', text: c.id, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        { type: 'text', text: 'ผู้แจ้ง', color: '#aaaaaa', size: 'sm', flex: 2 },
                                        { type: 'text', text: c.lineDisplayName || c.lineUserId, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        { type: 'text', text: 'เบอร์', color: '#aaaaaa', size: 'sm', flex: 2 },
                                        { type: 'text', text: c.phone || 'ไม่ระบุ', wrap: true, color: '#666666', size: 'sm', flex: 5 }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        { type: 'text', text: 'รายละเอียด', color: '#aaaaaa', size: 'sm', flex: 2 },
                                        { type: 'text', text: c.description, wrap: true, color: '#666666', size: 'sm', flex: 5 }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    contents: [
                                        { type: 'text', text: 'พิกัด', size: 'sm', color: '#aaaaaa', flex: 2 },
                                        {
                                            type: 'text',
                                            text: 'เปิดใน Google Maps',
                                            flex: 5,
                                            size: 'sm',
                                            color: '#155dfc',
                                            action: {
                                                type: 'uri',
                                                label: 'action',
                                                uri: mapUrl,
                                                altUri: { desktop: mapUrl }
                                            },
                                            decoration: 'underline'
                                        }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    contents: [
                                        { type: 'text', text: 'สถานะ', flex: 2, size: 'sm', color: '#aaaaaa' },
                                        { type: 'text', text: 'ดำเนินการเสร็จแล้ว', flex: 5, size: 'sm', color: '#666666' }
                                    ]
                                },
                                {
                                    type: 'box',
                                    layout: 'baseline',
                                    contents: [
                                        { type: 'text', text: 'สรุปผล', flex: 2, size: 'sm', color: '#aaaaaa' },
                                        { type: 'text', text: message || 'ไม่ระบุ', flex: 5, size: 'sm', color: '#666666' }
                                    ]
                                }
                            ]
                        },
                        { type: 'separator', margin: 'md' },
                        {
                            type: 'box',
                            layout: 'baseline',
                            contents: [
                                {
                                    type: 'text',
                                    text: 'เรื่องร้องเรียนนี้ดำเนินการแล้ว',
                                    wrap: true,
                                    weight: 'bold',
                                    align: 'center'
                                }
                            ],
                            margin: 'xl'
                        }
                    ]
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'button',
                            style: 'primary',
                            height: 'sm',
                            action: {
                                type: 'uri',
                                label: 'ดูรายละเอียด',
                                uri: `${process.env.WEB_BASE_URL}/admin/complaints/${c.id}`
                            }
                        }
                    ],
                    flex: 0
                }
            }
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