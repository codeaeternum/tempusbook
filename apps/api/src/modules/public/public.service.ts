import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicService {
    constructor(private prisma: PrismaService) { }

    async getBusinessProfileBySlug(slug: string) {
        const business = await this.prisma.business.findUnique({
            where: { slug },
            include: {
                services: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        price: true,
                        durationMinutes: true, // Fixed duration -> durationMinutes
                    },
                },
                members: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        role: true,
                        user: {
                            select: {
                                id: true,
                                firstName: true, // Fixed name -> firstName/lastName
                                lastName: true,
                                avatarUrl: true, // Fixed photoUrl -> avatarUrl
                            },
                        },
                    },
                },
                businessHours: true,
            },
        });

        if (!business) {
            throw new NotFoundException('Business not found');
        }

        if (business.status !== 'ACTIVE') {
            throw new NotFoundException('This business is currently not active.');
        }

        // Exclude sensitive B2B data
        const {
            stripeAccountId,
            mercadoPagoAccessToken,
            mercadoPagoRefreshToken,
            mercadoPagoPublicKey,
            settings,
            ...publicProfile
        } = business as any;

        return publicProfile;
    }

    async createPublicBooking(slug: string, dto: any) {
        const business = await this.prisma.business.findUnique({
            where: { slug }
        });

        if (!business) {
            throw new NotFoundException('Business not found');
        }

        const service = await this.prisma.service.findFirst({
            where: { id: dto.serviceId, businessId: business.id }
        });

        if (!service) {
            throw new NotFoundException('Service not valid or not found');
        }

        const [firstName, ...lastNameParts] = dto.clientName.trim().split(' ');
        const lastName = lastNameParts.join(' ') || 'Guest';

        const client = await this.prisma.user.upsert({
            where: { email: dto.clientEmail },
            update: {
                firstName,
                lastName,
                phone: dto.clientPhone,
            },
            create: {
                firebaseUid: `guest_${crypto.randomUUID()}`,
                email: dto.clientEmail,
                firstName,
                lastName,
                phone: dto.clientPhone,
                role: 'CLIENT',
            }
        });

        // Calculate End Time based on durationMinutes (Fixed TS issue on duration type)
        const startTimeDate = new Date(dto.startTime);
        const endTimeDate = new Date(startTimeDate.getTime() + service.durationMinutes * 60000);

        const booking = await this.prisma.booking.create({
            data: {
                businessId: business.id,
                clientId: client.id,
                serviceId: service.id,
                staffId: dto.staffId || null,
                startTime: startTimeDate,
                endTime: endTimeDate,
                status: 'PENDING',
                clientNotes: 'Agendado desde Portal B2C Link-in-Bio'
            }
        });

        return booking;
    }
}
