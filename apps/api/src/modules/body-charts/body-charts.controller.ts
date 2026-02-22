import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { BodyChartsService, UpsertBodyChartDto } from './body-charts.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RequirePlan } from '../auth/decorators/plan.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('clients/:clientId/body-charts')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@RequirePlan('PRO')
export class BodyChartsController {
    constructor(private readonly bodyChartsService: BodyChartsService) { }

    @Get()
    @Roles('PLATFORM_ADMIN', 'BUSINESS_USER')
    async getBodyChart(
        @Req() req: any,
        @Param('clientId') clientId: string
    ) {
        const businessId = req.user.businessId;
        return this.bodyChartsService.getBodyChart(businessId, clientId);
    }

    @Post()
    @Roles('PLATFORM_ADMIN', 'BUSINESS_USER')
    async upsertBodyChart(
        @Req() req: any,
        @Param('clientId') clientId: string,
        @Body() body: UpsertBodyChartDto
    ) {
        const businessId = req.user.businessId;
        return this.bodyChartsService.upsertBodyChart(businessId, clientId, body);
    }
}
