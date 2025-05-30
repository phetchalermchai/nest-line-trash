import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private dashboardService: DashboardService) { }

    @Get('summary')
    getSummary() {
        return this.dashboardService.getSummary();
    }

    @Get('monthly-trend')
    getMonthlyTrend(@Query('year') year: string) {
        const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
        return this.dashboardService.getMonthlyTrend(yearNum);
    }

    @Get('status-distribution')
    getStatusDistribution() {
        return this.dashboardService.getStatusDistribution();
    }

    @Get('recent')
    getRecentComplaints(@Query('limit') limit?: string) {
        let num = parseInt(limit ?? '5', 10);
        if (isNaN(num) || num < 1 || num > 100) {
            num = 5;
        }
        return this.dashboardService.getRecentComplaints(num);
    }

    @Get('monthly-status')
    getMonthlyStatus(@Query('year') year: string) {
        const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();
        return this.dashboardService.getMonthlyStatus(yearNum);
    }

}
