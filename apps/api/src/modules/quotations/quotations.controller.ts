import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto, UpdateQuotationStatusDto } from './dto/quotations.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Quotations')
@Controller('quotations')
export class QuotationsController {
    constructor(private readonly quotationsService: QuotationsService) { }

    @ApiBearerAuth()
    @UseGuards(FirebaseAuthGuard)
    @Post()
    create(@Body() createQuotationDto: CreateQuotationDto) {
        return this.quotationsService.create(createQuotationDto);
    }

    @ApiBearerAuth()
    @UseGuards(FirebaseAuthGuard)
    @Get('business/:businessId')
    findByBusiness(@Param('businessId') businessId: string) {
        return this.quotationsService.findByBusiness(businessId);
    }

    // Public Endpoint bridging Customers bypassing FirebaseAuth mapping via Magic URL
    @Public()
    @Get('magic/:token')
    findByMagicLink(@Param('token') token: string) {
        return this.quotationsService.findByMagicLink(token);
    }

    // Webhook-like endpoint allowing web users to approve
    @Public()
    @Patch('magic/:token/status')
    async updateStatusFromMagicLink(
        @Param('token') token: string,
        @Body() updateQuotationStatusDto: UpdateQuotationStatusDto,
    ) {
        const quotation = await this.quotationsService.findByMagicLink(token);
        return this.quotationsService.updateStatus(quotation.id, updateQuotationStatusDto);
    }

    @ApiBearerAuth()
    @UseGuards(FirebaseAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.quotationsService.findOne(id);
    }

    // Internal Staff Endpoint
    @ApiBearerAuth()
    @UseGuards(FirebaseAuthGuard)
    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() updateQuotationStatusDto: UpdateQuotationStatusDto,
    ) {
        return this.quotationsService.updateStatus(id, updateQuotationStatusDto);
    }
}
