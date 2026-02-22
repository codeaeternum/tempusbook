
import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Param,
    Body,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { BookingsService } from './bookings.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import {
    CreateBookingDto,
    UpdateBookingStatusDto,
    RescheduleBookingDto,
    JoinWaitlistDto
} from './dto/bookings.dto';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(FirebaseAuthGuard)
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    async create(@Body() body: CreateBookingDto, @Req() req: any) {
        return this.bookingsService.create({
            ...body,
            clientId: body.clientId || req.user.uid,
            startTime: new Date(body.startTime)
        });
    }

    @Public()
    @Post('public')
    async createPublic(@Body() body: any) {
        return this.bookingsService.publicCreate(body);
    }

    @Public()
    @Post('walk-in')
    async createWalkIn(@Body() body: any) {
        return this.bookingsService.createWalkIn(body);
    }

    // ==========================================
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

    @Public()
    @Get('available-slots')
    async getAvailableSlots(
        @Query('businessId') businessId: string,
        @Query('date') date: string,
        @Query('serviceId') serviceId: string,
        @Query('staffId') staffId?: string,
    ) {
        return this.bookingsService.getAvailableSlots(businessId, date, serviceId, staffId);
    }

    @Get('waitlist/business/:businessId')
    async getWaitlist(@Param('businessId') businessId: string) {
        return this.bookingsService.getWaitlistByBusiness(businessId);
    }

    @Patch('waitlist/:id/call')
    async callWaitlistClient(@Param('id') id: string) {
        return this.bookingsService.updateWaitlistStatus(id, 'OFFERED');
    }

    @Post('waitlist')
    async joinWaitlist(@Body() body: JoinWaitlistDto, @Req() req: any) {
        return this.bookingsService.joinWaitlist({
            businessId: body.businessId,
            clientId: body.clientId || req.user.uid,
            serviceId: body.serviceId,
            preferredDate: body.preferredDate ? new Date(body.preferredDate) : new Date(),
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
        @Body() body: UpdateBookingStatusDto,
    ) {
        return this.bookingsService.updateStatus(id, body.status, body.reason);
    }

    @Patch(':id/reschedule')
    async reschedule(
        @Param('id') id: string,
        @Body() body: RescheduleBookingDto,
    ) {
        return this.bookingsService.reschedule(id, new Date(body.startTime));
    }
}
