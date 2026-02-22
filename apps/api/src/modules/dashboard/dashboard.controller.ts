import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats/:businessId')
    @Roles('PLATFORM_ADMIN', 'BUSINESS_USER')
    async getDashboardStats(@Param('businessId') businessId: string) {
        return this.dashboardService.getDashboardStats(businessId);
    }

    @Get('upcoming-bookings/:businessId')
    @Roles('PLATFORM_ADMIN', 'BUSINESS_USER')
    async getUpcomingBookings(@Param('businessId') businessId: string) {
        return this.dashboardService.getUpcomingBookings(businessId);
    }

    @Get('recent-activity/:businessId')
    @Roles('PLATFORM_ADMIN', 'BUSINESS_USER')
    async getRecentActivity(@Param('businessId') businessId: string) {
        return this.dashboardService.getRecentActivity(businessId);
    }

    @Get('top-services/:businessId')
    @Roles('PLATFORM_ADMIN', 'BUSINESS_USER')
    async getTopServices(@Param('businessId') businessId: string) {
        return this.dashboardService.getTopServices(businessId);
    }
}
