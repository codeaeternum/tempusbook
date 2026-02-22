import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType, NotificationChannel } from '@prisma/client';
import { TwilioService } from './twilio.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService, private twilioService: TwilioService) { }

    async getUserNotifications(userId: string, limit = 50, offset = 0) {
        const notifications = await this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });

        const unreadCount = await this.prisma.notification.count({
            where: { userId, isRead: false },
        });

        return {
            items: notifications,
            meta: {
                total: unreadCount + (notifications.filter(n => n.isRead).length), // Total is tricky with cursor, approximate it or return count
                unreadCount,
                limit,
                offset
            }
        };
    }

    async getBusinessNotifications(businessId: string, limit = 50) {
        return this.prisma.notification.findMany({
            where: { businessId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async markAsRead(id: string, userId: string) {
        const notification = await this.prisma.notification.findUnique({
            where: { id }
        });

        if (!notification || notification.userId !== userId) {
            throw new NotFoundException('Notification not found');
        }

        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
    }

    // Método Interno para que otros módulos (Bookings, Users) emitan notificaciones
    async createInternalNotification(data: {
        userId: string;
        businessId?: string;
        type: NotificationType;
        channel: NotificationChannel;
        title: string;
        body: string;
        payload?: any;
    }) {
        const notification = await this.prisma.notification.create({
            data: {
                userId: data.userId,
                businessId: data.businessId,
                type: data.type,
                channel: data.channel,
                title: data.title,
                body: data.body,
                data: data.payload || {},
            }
        });

        // --- B2C OMNICHANNEL DISPATCHER (Twilio) ---
        if (data.channel === 'SMS' || data.channel === 'WHATSAPP') {
            const phone = data.payload?.phone;
            if (phone) {
                // Fire and forget via Twilio (non-blocking)
                this.twilioService.sendOmnichannelB2CMessage(phone, data.body, data.channel)
                    .catch(err => console.error('Error dispatching Omnichannel Notification:', err));
            } else {
                console.warn(`[Twilio Hub] Attempted to send ${data.channel} but no phone number provided in payload.`);
            }
        }

        return notification;
    }
}
