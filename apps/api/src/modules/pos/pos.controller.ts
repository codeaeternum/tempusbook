import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { PosService } from './pos.service';
import { OpenShiftDto, CloseShiftDto, CheckoutDto } from './dto/pos.dto';
import { CreateDraftSaleFromBookingDto } from './dto/draft-sale.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

import { PlanGuard } from '../auth/plan.guard';
import { RequirePlan } from '../auth/decorators/plan.decorator';

@Controller('pos')
@UseGuards(FirebaseAuthGuard, PlanGuard)
@RequirePlan('STARTER')
export class PosController {
    constructor(private readonly posService: PosService) { }

    @Post('shift/open')
    async openShift(@Body() dto: OpenShiftDto) {
        return this.posService.openShift(dto);
    }

    @Post('shift/close')
    async closeShift(@Body() dto: CloseShiftDto) {
        return this.posService.closeShift(dto);
    }

    @Get('shift/active')
    async getActiveShift(
        @Query('businessId') businessId: string,
        @Query('branchId') branchId?: string,
    ) {
        return this.posService.getActiveShift(businessId, branchId);
    }

    @Post('checkout')
    async checkout(@Body() dto: CheckoutDto) {
        return this.posService.checkout(dto);
    }

    @Get('catalog')
    async getCatalog(@Query('businessId') businessId: string) {
        return this.posService.getCatalog(businessId);
    }

    @Get('clients')
    async getClients(@Query('businessId') businessId: string) {
        return this.posService.getClients(businessId);
    }

    @Post('sales/from-booking')
    async createDraftFromBooking(@Body() dto: CreateDraftSaleFromBookingDto) {
        return this.posService.createDraftSaleFromBooking(dto);
    }
}
