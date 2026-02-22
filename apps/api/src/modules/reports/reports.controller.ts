import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('reports')
@UseGuards(FirebaseAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('dashboard/:businessId')
    getDashboardMetrics(@Param('businessId') businessId: string) {
        return this.reportsService.getDashboardMetrics(businessId);
    }
}
