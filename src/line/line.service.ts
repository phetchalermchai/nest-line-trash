import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ComplaintService } from '../complaint/complaint.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { Complaint, ComplaintSource, ComplaintStatus } from '@prisma/client';


@Injectable()
export class LineService {
    constructor(
        private complaintService: ComplaintService,
        private storageService: StorageService,
        private prisma: PrismaService
    ) { }

    private buildGroupFlex(c: Complaint, type: string = "ใหม่") {
        const lineDisplayName = c.reporterName || c.lineUserId;
        const mapUrl = c.location
            ? `https://www.google.com/maps/search/?api=1&query=${c.location}`
            : "https://www.google.com/maps";

        const statusColor: Record<ComplaintStatus, string> = {
            PENDING: "#efb100",
            DONE: "#3bb273",
        };

        const statusLabel: Record<ComplaintStatus, string> = {
            PENDING: "รอดำเนินการ",
            DONE: "เสร็จสิ้น",
        };

        const sourceColor: Record<ComplaintSource, string> = {
            LINE: "#00c300",
            FACEBOOK: "#1877f2",
            PHONE: "#f59e0b",
            COUNTER: "#9333ea",
            OTHER: "#6b7280",
        };

        const thaiDate = new Date(c.createdAt).toLocaleString("th-TH", {
            timeZone: "Asia/Bangkok",
            year: "numeric",
            month: "long",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });

        const isLine = c.source === "LINE";

        return {
            type: "flex",
            altText: `📌 เรื่องร้องเรียน - (${type})`,
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "image",
                            url: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Seal_of_Nonthaburi.jpg",
                            size: "sm"
                        },
                        {
                            type: "text",
                            text: `เรื่องร้องเรียน - (${type})`,
                            weight: "bold",
                            size: "lg",
                            align: "center",
                            margin: "lg"
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "text",
                                    text: "ช่องทาง:",
                                    color: "#aaaaaa",
                                    size: "sm",
                                    flex: 0
                                },
                                {
                                    type: "text",
                                    text: c.source,
                                    color: sourceColor[c.source],
                                    size: "sm",
                                    margin: "sm",
                                    flex: 0,
                                    weight: "bold"
                                }
                            ],
                            justifyContent: "center",
                            alignItems: "center"
                        },
                        {
                            type: "text",
                            text: `รหัสอ้างอิง: #${c.id.slice(-6).toUpperCase()}`,
                            size: "sm",
                            weight: "bold",
                            align: "center",
                            margin: "lg"
                        },
                        {
                            type: "text",
                            text: `${thaiDate} น.`,
                            size: "xs",
                            align: "center",
                            color: "#aaaaaa"
                        },
                        {
                            type: "separator",
                            margin: "lg"
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            margin: "lg",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "ผู้แจ้ง",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 2
                                        },
                                        {
                                            type: "text",
                                            text: lineDisplayName,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                !isLine && c.receivedBy && {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "ผู้รับแจ้ง",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 2
                                        },
                                        {
                                            type: "text",
                                            text: c.receivedBy,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "เบอร์",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 2
                                        },
                                        {
                                            type: "text",
                                            text: c.phone || "ไม่ระบุ",
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "รายละเอียด",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 2
                                        },
                                        {
                                            type: "text",
                                            text: c.description,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "พิกัด",
                                            size: "sm",
                                            color: "#aaaaaa",
                                            flex: 2
                                        },
                                        {
                                            type: "text",
                                            text: "เปิดใน Google Maps",
                                            flex: 5,
                                            size: "sm",
                                            color: "#155dfc",
                                            action: {
                                                type: "uri",
                                                label: "action",
                                                uri: mapUrl,
                                                altUri: {
                                                    desktop: mapUrl
                                                }
                                            },
                                            decoration: "underline"
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "สถานะ",
                                            flex: 2,
                                            size: "sm",
                                            color: "#aaaaaa"
                                        },
                                        {
                                            type: "text",
                                            text: statusLabel[c.status],
                                            flex: 5,
                                            size: "sm",
                                            color: statusColor[c.status],
                                            weight: "bold"
                                        }
                                    ]
                                }
                            ].filter(Boolean)
                        }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            height: "sm",
                            action: {
                                type: "uri",
                                label: "ดูรายละเอียด",
                                uri: `${process.env.WEB_BASE_URL}/complaints/${c.id}`
                            }
                        },
                        {
                            type: "button",
                            style: "secondary",
                            height: "sm",
                            action: {
                                type: "uri",
                                label: "แจ้งผลดำเนินงาน",
                                uri: `${process.env.WEB_BASE_URL}/admin/complaints/${c.id}/report`
                            }
                        }
                    ],
                    flex: 0
                }
            }
        };
    }


    private buildUserFlex(c: Complaint) {
        const lineDisplayName = c.reporterName || c.lineUserId;
        const mapUrl = c.location
            ? `https://www.google.com/maps/search/?api=1&query=${c.location}`
            : "https://www.google.com/maps";

        const statusLabel: Record<ComplaintStatus, string> = {
            PENDING: "รอดำเนินการ",
            DONE: "เสร็จสิ้น",
        };

        const statusColor: Record<ComplaintStatus, string> = {
            PENDING: "#efb100",
            DONE: "#3bb273",
        };

        const thaiDate = new Date(c.createdAt).toLocaleString("th-TH", {
            timeZone: "Asia/Bangkok",
            year: "numeric",
            month: "long",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });

        return {
            type: "flex",
            altText: "📬 ระบบได้รับเรื่องร้องเรียนของคุณแล้ว",
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "image",
                            url: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Seal_of_Nonthaburi.jpg",
                            size: "sm"
                        },
                        {
                            type: "text",
                            text: "เรื่องร้องเรียนของคุณ",
                            weight: "bold",
                            size: "lg",
                            align: "center",
                            margin: "lg"
                        },
                        {
                            type: "text",
                            text: `รหัสอ้างอิง: #${c.id.slice(-6).toUpperCase()}`,
                            size: "sm",
                            weight: "bold",
                            align: "center",
                            margin: "lg"
                        },
                        {
                            type: "text",
                            text: `${thaiDate} น.`,
                            size: "xs",
                            align: "center",
                            color: "#aaaaaa"
                        },
                        {
                            type: "separator",
                            margin: "lg"
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            margin: "lg",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "ผู้แจ้ง",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 2
                                        },
                                        {
                                            type: "text",
                                            text: lineDisplayName,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "เบอร์",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 2
                                        },
                                        {
                                            type: "text",
                                            text: c.phone || "ไม่ระบุ",
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "รายละเอียด",
                                            color: "#aaaaaa",
                                            size: "sm",
                                            flex: 2
                                        },
                                        {
                                            type: "text",
                                            text: c.description,
                                            wrap: true,
                                            color: "#666666",
                                            size: "sm",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "พิกัด",
                                            size: "sm",
                                            color: "#aaaaaa",
                                            flex: 2
                                        },
                                        {
                                            type: "text",
                                            text: "เปิดใน Google Maps",
                                            flex: 5,
                                            size: "sm",
                                            color: "#155dfc",
                                            action: {
                                                type: "uri",
                                                label: "action",
                                                uri: mapUrl,
                                                altUri: {
                                                    desktop: mapUrl
                                                }
                                            },
                                            decoration: "underline"
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    contents: [
                                        {
                                            type: "text",
                                            text: "สถานะ",
                                            flex: 2,
                                            size: "sm",
                                            color: "#aaaaaa"
                                        },
                                        {
                                            type: "text",
                                            text: statusLabel[c.status],
                                            flex: 5,
                                            size: "sm",
                                            color: statusColor[c.status],
                                            weight: "bold"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            type: "separator",
                            margin: "md"
                        },
                        {
                            type: "text",
                            text: "ระบบได้รับเรื่องร้องเรียนของคุณแล้ว",
                            wrap: true,
                            weight: "bold",
                            align: "center",
                            margin: "lg"
                        }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            height: "sm",
                            action: {
                                type: "uri",
                                label: "ดูรายละเอียด",
                                uri: `${process.env.WEB_BASE_URL}/complaints/${c.id}`
                            }
                        }
                    ],
                    flex: 0
                }
            }
        };
    }

    async notifyNewComplaint(id: string) {
        const c = await this.complaintService.findById(id);
        if (!c) throw new NotFoundException('Complaint not found');
        if (!c.lineUserId) throw new NotFoundException('Complaint does not have a LINE user ID');

        const flex = this.buildGroupFlex(c, "ใหม่");
        const userMsg = this.buildUserFlex(c);

        await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, [flex]);
        await this.pushMessageToUser(c.lineUserId, [userMsg]);

        return { message: 'ส่งข้อความเข้า group และตอบกลับผู้แจ้งเรียบร้อย' };
    }

    // Notify both user and group
    async notifyUserAndGroup(id: string) {
        const c = await this.complaintService.findById(id);
        if (!c) throw new NotFoundException('Complaint not found');
        if (!c.lineUserId) throw new BadRequestException('ไม่มี lineUserId');

        const flex = this.buildGroupFlex(c, "ใหม่");
        const userMsg = this.buildUserFlex(c);

        await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, [flex]);
        await this.pushMessageToUser(c.lineUserId, [userMsg]);

        return { message: 'ส่งเข้า group และแจ้งกลับผู้ใช้ LINE เรียบร้อย' };
    }

    // Notify only group without user
    async notifyGroupOnly(id: string) {
        const c = await this.complaintService.findById(id);
        if (!c) throw new NotFoundException('Complaint not found');

        const flex = this.buildGroupFlex(c, "ใหม่");
        await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, [flex]);

        return { message: 'ส่งข้อความเข้า group เจ้าหน้าที่เรียบร้อย' };
    }

    async notifyReminderComplaint(id: string) {
        const c = await this.complaintService.findById(id);
        if (!c) throw new NotFoundException("Complaint not found");

        const now = new Date();

        if (c.notifiedAt) {
            const diff = now.getTime() - new Date(c.notifiedAt).getTime();
            const diffDays = diff / (1000 * 60 * 60 * 24);

            if (diffDays < 1) {
                throw new BadRequestException("แจ้งเตือนซ้ำได้วันละ 1 ครั้ง");
            }
        }

        if (c.status === "DONE") {
            throw new BadRequestException("ไม่สามารถแจ้งเตือนได้ เนื่องจากเรื่องนี้ดำเนินการเสร็จแล้ว");
        }

        const created = new Date(c.createdAt);
        const diffCreatedDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        const flex = this.buildGroupFlex(c, `${diffCreatedDays} วัน`);

        await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, [flex]);

        await this.prisma.complaint.update({
            where: { id },
            data: { notifiedAt: now }
        });

        return { message: "แจ้งเตือนซ้ำสำเร็จ" };
    }

    async uploadImageAfter(id: string, files?: Express.Multer.File[], message?: string) {
        if (!message || message.trim() === "") {
            throw new BadRequestException("จำเป็นต้องระบุข้อความสรุปผล");
        }

        const c = await this.complaintService.findById(id);
        if (!c) throw new NotFoundException("Complaint not found");

        const uploadedUrls: string[] = [];

        if (files && files.length > 0) {
            const uploadPromises = files.map(async (file) => {
                const ext = path.extname(file.originalname) || '.jpg';
                const filename = `after-${randomUUID()}${ext}`;
                const imageUrl = await this.storageService.uploadImage(file.buffer, filename);
                uploadedUrls.push(imageUrl);
            });
            await Promise.all(uploadPromises);
        }

        await this.prisma.complaint.update({
            where: { id },
            data: {
                message,
                status: 'DONE',
                notifiedAt: new Date(),
                ...(uploadedUrls.length > 0 ? { imageAfter: uploadedUrls.join(",") } : {})
            }
        });

        const mapUrl = c.location
            ? `https://www.google.com/maps/search/?api=1&query=${c.location}`
            : 'https://www.google.com/maps';

        const userFlex = {
            type: "flex",
            altText: "📮 ผลการดำเนินงานของคุณ",
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "image",
                            url: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Seal_of_Nonthaburi.jpg",
                            size: "sm"
                        },
                        {
                            type: "text",
                            text: "เรื่องร้องเรียน (เสร็จสิ้น)",
                            weight: "bold",
                            size: "lg",
                            align: "center",
                            margin: "lg"
                        },
                        {
                            type: "text",
                            text: `รหัสอ้างอิง: #${c.id.slice(-6).toUpperCase()}`,
                            size: "sm",
                            weight: "bold",
                            align: "center",
                            margin: "lg"
                        },
                        {
                            type: "text",
                            text: `${new Date(c.updatedAt || c.createdAt).toLocaleString("th-TH", {
                                timeZone: "Asia/Bangkok",
                                year: "numeric",
                                month: "long",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false
                            })} น.`,
                            size: "xs",
                            align: "center",
                            color: "#aaaaaa"
                        },
                        {
                            type: "separator",
                            margin: "lg"
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            margin: "lg",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        { type: "text", text: "ผู้แจ้ง", color: "#aaaaaa", size: "sm", flex: 2 },
                                        { type: "text", text: c.reporterName, color: "#666666", size: "sm", wrap: true, flex: 5 }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        { type: "text", text: "เบอร์", color: "#aaaaaa", size: "sm", flex: 2 },
                                        { type: "text", text: c.phone || "ไม่ระบุ", color: "#666666", size: "sm", wrap: true, flex: 5 }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        { type: "text", text: "รายละเอียด", color: "#aaaaaa", size: "sm", flex: 2 },
                                        { type: "text", text: c.description, color: "#666666", size: "sm", wrap: true, flex: 5 }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    contents: [
                                        { type: "text", text: "พิกัด", size: "sm", color: "#aaaaaa", flex: 2 },
                                        {
                                            type: "text",
                                            text: "เปิดใน Google Maps",
                                            size: "sm",
                                            color: "#155dfc",
                                            flex: 5,
                                            action: {
                                                type: "uri",
                                                label: "map",
                                                uri: mapUrl,
                                                altUri: {
                                                    desktop: mapUrl
                                                }
                                            },
                                            decoration: "underline"
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    contents: [
                                        { type: "text", text: "สถานะ", size: "sm", color: "#aaaaaa", flex: 2 },
                                        {
                                            type: "text",
                                            text: "เสร็จสิ้น",
                                            size: "sm",
                                            color: "#3bb273",
                                            weight: "bold",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    contents: [
                                        { type: "text", text: "สรุปผล", size: "sm", color: "#aaaaaa", flex: 2 },
                                        {
                                            type: "text",
                                            text: message || "ไม่ระบุ",
                                            size: "sm",
                                            color: "#666666",
                                            wrap: true,
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    contents: [
                                        { type: "text", text: "", size: "sm", color: "#aaaaaa", flex: 2 },
                                        {
                                            type: "text",
                                            text: `${new Date(c.updatedAt).toLocaleString("th-TH", {
                                                timeZone: "Asia/Bangkok",
                                                year: "numeric",
                                                month: "long",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: false
                                            })} น.`,
                                            size: "sm",
                                            color: "#666666",
                                            wrap: true,
                                            flex: 5
                                        }
                                    ]
                                }
                            ]
                        },
                        { type: "separator", margin: "md" },
                        {
                            type: "text",
                            text: "เรื่องร้องเรียนของคุณได้รับการดำเนินการแล้ว",
                            weight: "bold",
                            align: "center",
                            wrap: true,
                            margin: "lg"
                        }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            height: "sm",
                            action: {
                                type: "uri",
                                label: "ดูรายละเอียด",
                                uri: `${process.env.WEB_BASE_URL}/complaints/${c.id}`
                            }
                        }
                    ],
                    flex: 0
                }
            }
        };


        const resultFlex = {
            type: "flex",
            altText: `📌 เรื่อง ID ${c.id.slice(0, 8)}... ดำเนินการเสร็จแล้ว`,
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "image",
                            url: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Seal_of_Nonthaburi.jpg",
                            size: "sm"
                        },
                        {
                            type: "text",
                            text: "เรื่องร้องเรียน (เสร็จสิ้น)",
                            weight: "bold",
                            size: "lg",
                            align: "center",
                            margin: "lg"
                        },
                        {
                            type: "text",
                            text: `รหัสอ้างอิง: #${c.id.slice(-6).toUpperCase()}`,
                            size: "sm",
                            weight: "bold",
                            align: "center",
                            margin: "lg"
                        },
                        {
                            type: "text",
                            text: `${new Date(c.updatedAt || c.createdAt).toLocaleString("th-TH", {
                                timeZone: "Asia/Bangkok",
                                year: "numeric",
                                month: "long",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false
                            })} น.`,
                            size: "xs",
                            align: "center",
                            color: "#aaaaaa"
                        },
                        {
                            type: "separator",
                            margin: "lg"
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            margin: "lg",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        { type: "text", text: "ผู้แจ้ง", color: "#aaaaaa", size: "sm", flex: 2 },
                                        { type: "text", text: c.reporterName || c.lineUserId, color: "#666666", size: "sm", wrap: true, flex: 5 }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        { type: "text", text: "เบอร์", color: "#aaaaaa", size: "sm", flex: 2 },
                                        { type: "text", text: c.phone || "ไม่ระบุ", color: "#666666", size: "sm", wrap: true, flex: 5 }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                        { type: "text", text: "รายละเอียด", color: "#aaaaaa", size: "sm", flex: 2 },
                                        { type: "text", text: c.description, color: "#666666", size: "sm", wrap: true, flex: 5 }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    contents: [
                                        { type: "text", text: "พิกัด", size: "sm", color: "#aaaaaa", flex: 2 },
                                        {
                                            type: "text",
                                            text: "เปิดใน Google Maps",
                                            size: "sm",
                                            color: "#155dfc",
                                            flex: 5,
                                            action: {
                                                type: "uri",
                                                label: "action",
                                                uri: mapUrl,
                                                altUri: { desktop: mapUrl }
                                            },
                                            decoration: "underline"
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    contents: [
                                        { type: "text", text: "สถานะ", size: "sm", color: "#aaaaaa", flex: 2 },
                                        {
                                            type: "text",
                                            text: "เสร็จสิ้น",
                                            size: "sm",
                                            color: "#3bb273",
                                            weight: "bold",
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    contents: [
                                        { type: "text", text: "สรุปผล", size: "sm", color: "#aaaaaa", flex: 2 },
                                        {
                                            type: "text",
                                            text: message || "ไม่ระบุ",
                                            size: "sm",
                                            color: "#666666",
                                            wrap: true,
                                            flex: 5
                                        }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    contents: [
                                        { type: "text", text: "", size: "sm", color: "#aaaaaa", flex: 2 },
                                        {
                                            type: "text",
                                            text: `${new Date(c.updatedAt).toLocaleString("th-TH", {
                                                timeZone: "Asia/Bangkok",
                                                year: "numeric",
                                                month: "long",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                hour12: false
                                            })} น.`,
                                            size: "sm",
                                            color: "#666666",
                                            wrap: true,
                                            flex: 5
                                        }
                                    ]
                                }
                            ]
                        },
                        { type: "separator", margin: "md" },
                        {
                            type: "text",
                            text: "เรื่องร้องเรียนนี้ได้รับการดำเนินการแล้ว",
                            wrap: true,
                            weight: "bold",
                            align: "center",
                            margin: "xl"
                        }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                        {
                            type: "button",
                            style: "primary",
                            height: "sm",
                            action: {
                                type: "uri",
                                label: "ดูรายละเอียด",
                                uri: `${process.env.WEB_BASE_URL}/complaints/${c.id}`
                            }
                        }
                    ],
                    flex: 0
                }
            }
        };

        if (c.lineUserId) {
            await this.pushMessageToUser(c.lineUserId, [userFlex]);
        }
        await this.pushMessageToGroup(process.env.LINE_GROUP_ID!, [resultFlex]);

        return {
            message: 'อัปเดตและแจ้งเรียบร้อย',
            ...(uploadedUrls.length > 0 ? { imageUrls: uploadedUrls } : {})
        };
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