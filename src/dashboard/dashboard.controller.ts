import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
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
