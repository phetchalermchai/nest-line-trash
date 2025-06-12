import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComplaintStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getSummary() {
        const total = await this.prisma.complaint.count();
        const done = await this.prisma.complaint.count({ where: { status: 'DONE' } });
        const pending = await this.prisma.complaint.count({ where: { status: 'PENDING' } });

        const latest = await this.prisma.complaint.findFirst({
            orderBy: { updatedAt: 'desc' },
            select: { updatedAt: true },
        });

        const formatDateThai = (date: Date) =>
            new Intl.DateTimeFormat('th-TH', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).format(date);

        return {
            total,
            done,
            pending,
            latestUpdatedAt: latest?.updatedAt ? formatDateThai(latest.updatedAt) : null,
        };
    }

    async getMonthlyTrend(year: number) {
        const raw = await this.prisma.$queryRaw<
            { month: number; count: bigint }[]
        >`
    SELECT 
      EXTRACT(MONTH FROM "createdAt") AS month,
      COUNT(*) as count
    FROM "Complaint"
    WHERE EXTRACT(YEAR FROM "createdAt") = ${year}
    GROUP BY month
    ORDER BY month ASC;
  `;

        // แปลง BigInt และจัดเรียงให้มีครบ 12 เดือน
        const resultMap = new Map<number, number>();
        raw.forEach(item => {
            resultMap.set(Number(item.month), Number(item.count));
        });

        const result = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            return {
                month,
                count: resultMap.get(month) || 0,
            };
        });

        return result;
    }

    async getStatusDistribution() {
        const result = await this.prisma.$queryRaw<
            { status: string; count: bigint }[]
        >`
    SELECT status, COUNT(*) as count
    FROM "Complaint"
    GROUP BY status;
  `;

        // แปลง BigInt → number
        return result.map(item => ({
            status: item.status,
            count: Number(item.count),
        }));
    }

    async getRecentComplaints(limit: number = 5) {
        const data = await this.prisma.complaint.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                reporterName: true,
                createdAt: true,
                status: true,
            },
        });

        const formatDateThai = (date: Date) =>
            new Intl.DateTimeFormat('th-TH', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).format(date);

        // แปลง createdAt เป็น ISO string เพื่อให้ frontend ใช้ง่าย
        return data.map((item) => ({
            ...item,
            createdAt: formatDateThai(item.createdAt),
        }));
    }

    async getMonthlyStatus(year: number) {
        const raw = await this.prisma.$queryRaw<
            { month: number; status: string; count: bigint }[]
        >`
    SELECT 
      EXTRACT(MONTH FROM "createdAt") AS month,
      status,
      COUNT(*) as count
    FROM "Complaint"
    WHERE EXTRACT(YEAR FROM "createdAt") = ${year}
    GROUP BY month, status
    ORDER BY month ASC;
  `;

        const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
        const allStatuses = ['PENDING', 'DONE'];
        const lookup = new Map<string, number>();

        raw.forEach(({ month, status, count }) => {
            lookup.set(`${month}-${status}`, Number(count));
        });

        return allMonths.flatMap(month =>
            allStatuses.map(status => ({
                month,
                status,
                count: lookup.get(`${month}-${status}`) || 0,
            }))
        );
    }

}
