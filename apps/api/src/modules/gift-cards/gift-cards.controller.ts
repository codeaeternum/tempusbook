import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { GiftCardsService } from './gift-cards.service';
import { IssueGiftCardDto, RedeemGiftCardDto } from './dto/gift-cards.dto';

@ApiTags('GiftCards')
@ApiBearerAuth()
@Controller('gift-cards')
@UseGuards(FirebaseAuthGuard)
export class GiftCardsController {
    constructor(private readonly giftCardsService: GiftCardsService) { }

    @Post('issue')
    async issueGiftCard(@Body() body: IssueGiftCardDto) {
        return this.giftCardsService.issueCard(body);
    }

    @Get('business/:businessId')
    async getGiftCards(@Param('businessId') businessId: string) {
        return this.giftCardsService.getBusinessCards(businessId);
    }

    @Get('check')
    async checkBalance(@Query('code') code: string, @Query('businessId') businessId: string) {
        return this.giftCardsService.checkBalance(code, businessId);
    }

    @Post('redeem')
    async redeemGiftCard(@Body() body: RedeemGiftCardDto) {
        return this.giftCardsService.deductBalance(body);
    }
}
