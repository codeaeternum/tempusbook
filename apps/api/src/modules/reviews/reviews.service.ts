import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
    constructor(private prisma: PrismaService) { }

    async findByBusiness(businessId: string) {
        return this.prisma.review.findMany({
            where: { businessId },
            include: {
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true
                    }
                },
                booking: {
                    include: {
                        service: {
                            select: { name: true }
                        },
                        staff: {
                            include: {
                                user: {
                                    select: { firstName: true, lastName: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async createReview(data: { bookingId: string, clientId: string, businessId: string, rating: number, comment?: string, tipsAmt?: number }) {
        // Enforce maximum 1 review per booking
        const existing = await this.prisma.review.findFirst({
            where: { bookingId: data.bookingId }
        });
        if (existing) {
            throw new NotFoundException('Ya has calificado esta cita previamente.');
        }

        // If they left a tip, we could generate a Tip Payment intent here (Optional/Future).

        return this.prisma.review.create({
            data: {
                bookingId: data.bookingId,
                clientId: data.clientId,
                businessId: data.businessId,
                rating: data.rating,
                comment: data.comment,
            }
        });
    }

    async replyToReview(id: string, replyText: string) {
        const review = await this.prisma.review.findUnique({ where: { id } });
        if (!review) throw new NotFoundException('Review not found');

        return this.prisma.review.update({
            where: { id },
            data: {
                reply: replyText,
                repliedAt: new Date()
            }
        });
    }
}
