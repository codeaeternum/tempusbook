import { Controller, Get, Param, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('reviews')
@UseGuards(FirebaseAuthGuard)
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Get('business/:businessId')
    findByBusiness(@Param('businessId') businessId: string) {
        return this.reviewsService.findByBusiness(businessId);
    }

    @Post()
    createReview(
        @Body() data: { bookingId: string, clientId: string, businessId: string, rating: number, comment?: string, tipsAmt?: number }
    ) {
        return this.reviewsService.createReview(data);
    }

    @Patch(':id/reply')
    replyToReview(
        @Param('id') id: string,
        @Body('reply') reply: string
    ) {
        return this.reviewsService.replyToReview(id, reply);
    }
}
