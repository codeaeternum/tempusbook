import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    async create(@Body() body: any, @Req() req: any) {
        return this.bookingsService.create({
            ...body,
            clientId: body.clientId || req.user.uid,
        });
    }

    @Get('business/:businessId')
    async findByBusiness(
        @Param('businessId') businessId: string,
        @Query('date') date?: string,
        @Query('staffId') staffId?: string,
        @Query('status') status?: string,
    ) {
        return this.bookingsService.findByBusiness(businessId, {
            date,
            staffId,
            status,
        });
    }

    @Get('my')
    async findMyBookings(
        @Req() req: any,
        @Query('upcoming') upcoming?: string,
    ) {
        return this.bookingsService.findByClient(
            req.user.uid,
            upcoming !== 'false',
        );
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: string; reason?: string },
    ) {
        return this.bookingsService.updateStatus(id, body.status, body.reason);
    }

    @Patch(':id/reschedule')
    async reschedule(
        @Param('id') id: string,
        @Body() body: { startTime: string },
    ) {
        return this.bookingsService.reschedule(id, new Date(body.startTime));
    }
}
