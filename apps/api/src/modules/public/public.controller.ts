import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { PublicService } from './public.service';
import { CreatePublicBookingDto } from './dto/create-public-booking.dto';

@Controller('public')
export class PublicController {
    constructor(private readonly publicService: PublicService) { }

    @Get('businesses/:slug')
    async getBusinessBySlug(@Param('slug') slug: string) {
        return this.publicService.getBusinessProfileBySlug(slug);
    }

    @Post('businesses/:slug/bookings')
    async createBooking(
        @Param('slug') slug: string,
        @Body() createBookingDto: CreatePublicBookingDto
    ) {
        return this.publicService.createPublicBooking(slug, createBookingDto);
    }
}
