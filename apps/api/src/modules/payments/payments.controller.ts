import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payments.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('payments')
@UseGuards(FirebaseAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    create(@Query('businessId') businessId: string, @Body() createPaymentDto: CreatePaymentDto) {
        return this.paymentsService.create(businessId, createPaymentDto);
    }

    @Get()
    findAll(@Query('businessId') businessId: string) {
        return this.paymentsService.findAll(businessId);
    }

    @Patch(':id/complete')
    complete(@Param('id') id: string, @Query('businessId') businessId: string) {
        return this.paymentsService.complete(id, businessId);
    }

    @Patch(':id/refund')
    refund(@Param('id') id: string, @Query('businessId') businessId: string) {
        return this.paymentsService.refund(id, businessId);
    }
}
