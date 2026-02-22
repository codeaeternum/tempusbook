import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RequirePlan } from '../auth/decorators/plan.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface CreatePrescriptionDto {
    diagnosis?: string;
    notes?: string;
    doctorName?: string;
    items: Array<{
        medicationName: string;
        dosage: string;
        frequency: string;
        duration: string;
        notes?: string;
    }>;
}

@Controller('clients/:clientId/prescriptions')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@RequirePlan('PRO') // Feature requiring PRO tier or above
export class PrescriptionsController {
    constructor(private readonly prescriptionsService: PrescriptionsService) { }

    @Post()
    @Roles('PLATFORM_ADMIN', 'BUSINESS_USER')
    async create(
        @Req() req: any,
        @Param('clientId') clientId: string,
        @Body() body: CreatePrescriptionDto
    ) {
        const businessId = req.user.businessId;
        return this.prescriptionsService.create(businessId, clientId, body);
    }

    @Get()
    @Roles('PLATFORM_ADMIN', 'BUSINESS_USER')
    async findAll(
        @Req() req: any,
        @Param('clientId') clientId: string
    ) {
        const businessId = req.user.businessId;
        return this.prescriptionsService.findAll(businessId, clientId);
    }

    @Get(':id')
    @Roles('PLATFORM_ADMIN', 'BUSINESS_USER')
    async findOne(
        @Req() req: any,
        @Param('clientId') clientId: string,
        @Param('id') id: string
    ) {
        const businessId = req.user.businessId;
        return this.prescriptionsService.findOne(businessId, id);
    }
}
