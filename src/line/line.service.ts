import { Injectable } from '@nestjs/common';
import { ComplaintService } from '../complaint/complaint.service';
import { randomUUID } from 'crypto';
import axios from 'axios';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class LineService {
    constructor(
        private complaintService: ComplaintService,
        private storageService: StorageService,
    ) { }

    async handleWebhook(body: any) {
        const events = body.events;

        for (const event of events) {
            const lineUserId = event.source?.userId;

            if (event.type === 'message' && event.message.type === 'text') {
                const description = event.message.text;

                await this.complaintService.createComplaint({
                    lineUserId,
                    description,
                    imageBefore: 'https://via.placeholder.com/400x300.png?text=รอ+แนบรูป',
                });
            }

            if (event.type === 'message' && event.message.type === 'image') {
                const messageId = event.message.id;

                const headers = {
                    Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}`,
                };

                try {
                    const imageResponse = await axios.get(
                        `https://api-data.line.me/v2/bot/message/${messageId}/content`,
                        {
                            headers,
                            responseType: 'arraybuffer',
                            validateStatus: () => true,
                        },
                    );

                    if (!imageResponse.headers['content-type']?.startsWith('image/')) {
                        console.error('❌ LINE image API response is not image:', imageResponse.status);
                        return;
                    }

                    const buffer = Buffer.from(imageResponse.data, 'binary');
                    const filename = `line-${randomUUID()}.jpg`;
                    const imageUrl = await this.storageService.uploadImage(buffer, filename);

                    await this.complaintService.createComplaint({
                        lineUserId,
                        description: 'ภาพจากผู้ใช้ LINE',
                        imageBefore: imageUrl,
                    });
                } catch (err) {
                    console.error('❌ Failed to load image from LINE API:', err.message);
                }
            }
        }

        return { status: 'ok' };
    }
}