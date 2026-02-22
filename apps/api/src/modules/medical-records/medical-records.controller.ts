import { Controller, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('medical-records')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class MedicalRecordsController {
    constructor(private readonly service: MedicalRecordsService) { }

    @Get('business/:businessId/client/:clientId')
    @Roles('PLATFORM_ADMIN', 'BUSINESS_USER')
    async getRecord(@Param('businessId') businessId: string, @Param('clientId') clientId: string) {
        return this.service.getRecord(businessId, clientId);
    }

    @Patch('business/:businessId/client/:clientId')
    @Roles('PLATFORM_ADMIN', 'BUSINESS_USER')
    async updateRecord(
        @Param('businessId') businessId: string,
        @Param('clientId') clientId: string,
        @Body() data: any
    ) {
        return this.service.updateRecord(businessId, clientId, data);
    }
}
