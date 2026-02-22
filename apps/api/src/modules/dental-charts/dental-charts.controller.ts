import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DentalChartsService } from './dental-charts.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RequirePlan } from '../auth/decorators/plan.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('clients/:clientId/dental-chart')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@RequirePlan('PRO') // Premium Clinical Feature
export class DentalChartsController {
    constructor(private readonly dentalChartsService: DentalChartsService) { }

    @Get()
    @Roles('PLATFORM_ADMIN', 'BUSINESS_USER')
    async getDentalChart(
        @Req() req: any,
        @Param('clientId') clientId: string
    ) {
        const businessId = req.user.businessId;
        return this.dentalChartsService.getDentalChart(businessId, clientId);
    }

    @Post()
    @Roles('PLATFORM_ADMIN', 'BUSINESS_USER')
    async upsertDentalChart(
        @Req() req: any,
        @Param('clientId') clientId: string,
        @Body() body: { teethData: any, notes?: string }
    ) {
        const businessId = req.user.businessId;
        return this.dentalChartsService.upsertDentalChart(businessId, clientId, body);
    }
}
