import { Controller, Get, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(FirebaseAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async getMyNotifications(@CurrentUser() user: any, @Query('limit') limit: string) {
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        return this.notificationsService.getUserNotifications(user.uid, parsedLimit);
    }

    @Patch('read-all')
    async markAllAsRead(@CurrentUser() user: any) {
        return this.notificationsService.markAllAsRead(user.uid);
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
        return this.notificationsService.markAsRead(id, user.uid);
    }
}
