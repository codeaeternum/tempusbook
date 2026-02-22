import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, PrismaClient, DayOfWeek } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PLAN_HIERARCHY } from '../auth/config/plan-limits';

// Type for the transactional Prisma client provided inside $transaction callbacks
type TxClient = Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class BookingsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    async create(data: {
        businessId: string;
        clientId: string;
        serviceId: string;
        staffId?: string;
        branchId?: string;
        startTime: Date;
        clientNotes?: string;
        intakeFormData?: Record<string, unknown>;
    }) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                // Get service to calculate end time and read buffer/overlapping config
                const service = await tx.service.findUnique({
                    where: { id: data.serviceId },
                });
                if (!service) throw new NotFoundException('Service not found');

                const startTime = new Date(data.startTime);
                const endTime = new Date(
                    startTime.getTime() + service.durationMinutes * 60 * 1000,
                );

                // Delegate collision check to the centralized helper
                await this.checkSlotAvailability(tx, {
                    businessId: data.businessId,
                    staffId: data.staffId,
                    startTime,
                    endTime,
                    service,
                });

                return tx.booking.create({
                    data: {
                        ...data,
                        intakeFormData: (data.intakeFormData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                        startTime,
                        endTime,
                        status: 'PENDING',
                    },
                    include: {
                        service: true,
                        business: true,
                    },
                });
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

            // --- SINERGIA DUAL (WHATSAPP AUTOMÁTICO PRO) ---
            try {
                const subscription = await this.prisma.subscription.findUnique({ where: { businessId: data.businessId } });
                const currentPlan = (subscription?.status === 'TRIAL' || subscription?.status === 'ACTIVE') ? (subscription.plan || 'FREE') : 'FREE';
                const isPremium = (PLAN_HIERARCHY[currentPlan] || 0) >= PLAN_HIERARCHY['PRO'];

                if (isPremium) {
                    const client = await this.prisma.user.findUnique({ where: { id: data.clientId } });
                    if (client && client.phone) {
                        await this.notificationsService.createInternalNotification({
                            userId: client.id,
                            businessId: data.businessId,
                            type: 'APPOINTMENT_REMINDER',
                            channel: 'WHATSAPP',
                            title: 'Cita Confirmada ✨',
                            body: `Hola ${client.firstName}, tu cita para ${result.service.name} está confirmada.`,
                            payload: { phone: client.phone, actionUrl: `/reserva/${result.business.slug}` }
                        });
                    }
                }
            } catch (err) {
                console.error('[Sinergia Dual] Failed to trigger auto-whatsapp:', err);
            }

            return result;
        } catch (error) {
            // P2034 is Prisma's code for a transaction conflict/serialization failure
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
                throw new BadRequestException('Time slot was just taken by someone else (Conflict)');
            }
            throw error;
        }
    }

    async findByBusiness(
        businessId: string,
        params: { date?: string; staffId?: string; status?: string },
    ) {
        const where: Prisma.BookingWhereInput = { businessId };

        if (params.date) {
            const start = new Date(params.date);
            const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
            where.startTime = { gte: start, lt: end };
        }

        if (params.staffId) where.staffId = params.staffId;
        // Map string to enum manually if provided
        if (params.status) where.status = params.status as any;

        return this.prisma.booking.findMany({
            where,
            include: {
                service: true,
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        avatarUrl: true,
                    },
                },
                staff: {
                    include: {
                        user: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });
    }

    async findByClient(clientId: string, upcoming: boolean = true) {
        const where: Prisma.BookingWhereInput = { clientId };

        if (upcoming) {
            where.startTime = { gte: new Date() };
            where.status = { in: ['PENDING', 'CONFIRMED'] };
        }

        return this.prisma.booking.findMany({
            where,
            include: {
                service: true,
                business: { select: { id: true, name: true, slug: true, logoUrl: true } },
            },
            orderBy: { startTime: upcoming ? 'asc' : 'desc' },
            take: 50,
        });
    }

    async updateStatus(id: string, status: string, reason?: string) {
        // Enforce valid enum status
        const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
        if (!validStatuses.includes(status)) {
            throw new BadRequestException('Invalid booking status');
        }

        const booking = await this.prisma.booking.findUnique({ where: { id } });
        if (!booking) throw new NotFoundException('Booking not found');

        const updateData: Prisma.BookingUpdateInput = {
            status: status as any
        };

        if (status === 'CANCELLED') {
            updateData.cancelledAt = new Date();
            updateData.cancelReason = reason;

            // Trigger Cascade Offer / Waitlist gap filling asynchronously
            // We do not await it so it doesn't block the cancellation response
            this.processWaitlistOnCancellation(booking).catch(err => {
                console.error('Failed to process waitlist cascade:', err);
            });
        }

        // Sinergia #2: Si la cita finaliza exitosamente, disparamos Notificación B2C para dejar Reseña.
        if (status === 'COMPLETED') {
            try {
                // Notificar al Cliente (Consumidor Final B2C)
                await this.prisma.notification.create({
                    data: {
                        userId: booking.clientId,
                        businessId: booking.businessId,
                        title: '¿Qué tal te pareció nuestro servicio? ✨',
                        body: 'Tu pago y visita han concluido. Califícanos y ayuda a otros regalándonos tus comentarios.',
                        type: 'REVIEW_REQUEST',
                        channel: 'IN_APP',
                        data: {
                            actionUrl: `/reserva/review/${booking.id}`,
                        }
                    }
                });
            } catch (error) {
                console.error('Failed to trigger synergy review notification:', error);
            }
        }

        return this.prisma.booking.update({
            where: { id },
            data: updateData,
        });
    }

    async reschedule(id: string, newStartTime: Date) {
        try {
            return await this.prisma.$transaction(async (tx) => {
                const booking = await tx.booking.findUnique({
                    where: { id },
                    include: { service: true, business: true },
                });

                if (!booking) throw new NotFoundException('Booking not found');

                // Check reschedule limit from business settings
                const settings = booking.business.settings as any;
                const maxReschedules = settings?.maxReschedules ?? 2;

                if (booking.rescheduleCount >= maxReschedules) {
                    throw new BadRequestException(
                        `Maximum reschedules (${maxReschedules}) reached`,
                    );
                }

                const startTime = new Date(newStartTime);
                const endTime = new Date(
                    startTime.getTime() + booking.service.durationMinutes * 60 * 1000,
                );

                // Delegate collision check to the centralized helper
                await this.checkSlotAvailability(tx, {
                    businessId: booking.businessId,
                    staffId: booking.staffId ?? undefined,
                    startTime,
                    endTime,
                    service: booking.service,
                    excludeBookingId: id,
                });

                return tx.booking.update({
                    where: { id },
                    data: {
                        startTime,
                        endTime,
                        rescheduleCount: { increment: 1 },
                    },
                });
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
                throw new BadRequestException('Time slot was just taken by someone else (Conflict)');
            }
            throw error;
        }
    }

    // ==========================================
    // Core Collision Detection Engine
    // ==========================================

    /**
     * Centralized slot availability check with Buffer Time and Overlapping support.
     *
     * BUFFER TIME: If a Service has bufferTimeMinutes > 0, the collision window
     * is expanded. Example: A 60-min massage ending at 2:00 PM with a 15-min buffer
     * means no new booking can start until 2:15 PM for that staff member.
     *
     * OVERLAPPING / GROUP CLASSES: If a Service has allowOverlapping = true,
     * instead of blocking on ANY conflict, we COUNT concurrent bookings and
     * only block when maxCapacity is reached. This enables gym classes, yoga
     * sessions, and tutoring groups where multiple clients book the same time slot.
     */
    private async checkSlotAvailability(
        tx: TxClient,
        params: {
            businessId: string;
            staffId?: string;
            startTime: Date;
            endTime: Date;
            service: {
                bufferTimeMinutes: number;
                allowOverlapping: boolean;
                isGroup: boolean;
                maxCapacity: number | null;
            };
            excludeBookingId?: string;
        },
    ): Promise<void> {
        const { businessId, staffId, startTime, endTime, service, excludeBookingId } = params;
        const bufferMs = (service.bufferTimeMinutes ?? 0) * 60 * 1000;

        // Expand the collision window by the buffer time.
        // The buffer applies AFTER the booking ends, so we check if any existing
        // booking's start time falls within [startTime, endTime + buffer].
        // Conversely, the new booking must not start within an existing booking's
        // [startTime, endTime + buffer] window.
        const bufferedEndTime = new Date(endTime.getTime() + bufferMs);

        // Build the WHERE clause for conflict detection
        const conflictWhere: Prisma.BookingWhereInput = {
            businessId,
            status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
            // Time overlap check: existing.start < newEnd+buffer AND existing.end+buffer > newStart
            startTime: { lt: bufferedEndTime },
            endTime: { gt: new Date(startTime.getTime() - bufferMs) },
        };

        // Staff-scoped conflict: only check the same staff member
        if (staffId) {
            conflictWhere.staffId = staffId;
        }

        // Exclude current booking when rescheduling
        if (excludeBookingId) {
            conflictWhere.id = { not: excludeBookingId };
        }

        // ========================================
        // BRANCH: Overlapping (Group Classes) vs Individual
        // ========================================
        if (service.allowOverlapping || service.isGroup) {
            // GROUP/OVERLAPPING MODE: Count concurrent bookings for this exact service time
            // and compare against maxCapacity
            const capacity = service.maxCapacity ?? Infinity;

            const concurrentCount = await tx.booking.count({
                where: {
                    ...conflictWhere,
                    serviceId: undefined, // For group classes, check ALL bookings in the slot, not just this service
                },
            });

            if (concurrentCount >= capacity) {
                throw new BadRequestException(
                    `This time slot is full (${concurrentCount}/${capacity} spots taken)`,
                );
            }

            // Slot is available — there's still room
            return;
        }

        // INDIVIDUAL MODE: Any single conflict blocks the slot
        const conflict = await tx.booking.findFirst({
            where: conflictWhere,
        });

        if (conflict) {
            throw new BadRequestException(
                bufferMs > 0
                    ? `Time slot not available (includes ${service.bufferTimeMinutes} min buffer for preparation)`
                    : 'Time slot not available',
            );
        }
    }

    // ==========================================
    // Public Booking Engine (B2C Data)
    // ==========================================

    async getAvailableSlots(businessId: string, dateStr: string, serviceId: string, staffId?: string) {
        // Parse the target date
        // Note: For simplicity, matching system timezone. In real global apps, timezones must be considered.
        const targetDate = new Date(dateStr); // Expected format YYYY-MM-DD
        if (isNaN(targetDate.getTime())) throw new BadRequestException('Invalid date format');

        const jsDay = targetDate.getDay(); // 0 (Sun) - 6 (Sat)
        const prismaDays: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const dayOfWeek = prismaDays[jsDay];

        // 1. Fetch Business and its Hours
        const business = await this.prisma.business.findUnique({
            where: { id: businessId },
            include: { businessHours: { where: { dayOfWeek } } }
        });

        if (!business) throw new NotFoundException('Business not found');
        const todayHours = business.businessHours[0];
        if (!todayHours || !todayHours.isActive) return []; // Business is closed today

        // 2. Fetch the requested Service
        const service = await this.prisma.service.findUnique({
            where: { id: serviceId }
        });
        if (!service) throw new NotFoundException('Service not found');

        const defaultSlotIntervalMins = 30; // 30-min intervals for slot generation
        const durationMs = service.durationMinutes * 60 * 1000;
        const bufferMs = (service.bufferTimeMinutes ?? 0) * 60 * 1000;

        // 3. Fetch Existing Bookings for this day
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const bookingsWhere: Prisma.BookingWhereInput = {
            businessId,
            status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
            startTime: { gte: startOfDay, lt: endOfDay }
        };
        if (staffId) bookingsWhere.staffId = staffId;

        const existingBookings = await this.prisma.booking.findMany({
            where: bookingsWhere,
            select: { startTime: true, endTime: true }
        });

        // 4. Generate & Filter Slots
        const slots: string[] = [];

        // Parse "HH:mm" to Date objects for today
        const [openH, openM] = todayHours.openTime.split(':').map(Number);
        const [closeH, closeM] = todayHours.closeTime.split(':').map(Number);

        let currentSlot = new Date(targetDate);
        currentSlot.setHours(openH, openM, 0, 0);

        const closeMarker = new Date(targetDate);
        closeMarker.setHours(closeH, closeM, 0, 0);

        while (currentSlot.getTime() + durationMs <= closeMarker.getTime()) {
            const slotStartMs = currentSlot.getTime();
            const slotEndMs = slotStartMs + durationMs;
            const slotEndWithBufferMs = slotEndMs + bufferMs;

            let isAvailable = true;

            // Collision check (Overlapping feature vs Individual)
            if (service.allowOverlapping || service.isGroup) {
                const concurrentCount = existingBookings.filter(b =>
                    b.startTime.getTime() < slotEndWithBufferMs &&
                    (b.endTime.getTime() + bufferMs) > slotStartMs
                ).length;

                if (concurrentCount >= (service.maxCapacity ?? Infinity)) {
                    isAvailable = false;
                }
            } else {
                const conflict = existingBookings.find(b =>
                    b.startTime.getTime() < slotEndWithBufferMs &&
                    (b.endTime.getTime() + bufferMs) > slotStartMs
                );
                if (conflict) isAvailable = false;
            }

            // Exclude past slots if today
            if (slotStartMs < Date.now()) {
                isAvailable = false;
            }

            if (isAvailable) {
                const h = currentSlot.getHours().toString().padStart(2, '0');
                const m = currentSlot.getMinutes().toString().padStart(2, '0');
                slots.push(`${h}:${m}`);
            }

            // Advance by intervals
            currentSlot = new Date(currentSlot.getTime() + defaultSlotIntervalMins * 60 * 1000);
        }

        return slots;
    }

    async publicCreate(data: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        businessId: string;
        serviceId: string;
        staffId?: string;
        startTime: string;
        clientNotes?: string;
    }) {
        if (!data.email) throw new BadRequestException('El correo electrónico es obligatorio para reservas como invitado.');

        // 1. Find or Create Shadow User (Guest)
        // We do this outside the main booking transaction so that if booking fails (e.g., slot taken),
        // we still cleanly retain the lead.

        let client = await this.prisma.user.findUnique({
            where: { email: data.email }
        });

        if (!client) {
            // Generate a placeholder Firebase UID for the guest
            const randomGuestUid = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            client = await this.prisma.user.create({
                data: {
                    firebaseUid: randomGuestUid,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    role: 'CLIENT',
                }
            });
        } else {
            // Optionally update their phone or name if they changed it
            if (data.phone && client.phone !== data.phone) {
                client = await this.prisma.user.update({
                    where: { id: client.id },
                    data: { phone: data.phone }
                });
            }
        }

        // 2. Delegate to the hardened Creation Engine
        return this.create({
            businessId: data.businessId,
            clientId: client.id,
            serviceId: data.serviceId,
            staffId: data.staffId,
            startTime: new Date(data.startTime),
            clientNotes: data.clientNotes,
        });
    }

    // ==========================================
    // Kiosk Terminal Engine (Walk-Ins)
    // ==========================================

    async createWalkIn(data: {
        firstName: string;
        lastName?: string;
        businessId: string;
        serviceId: string;
        phone?: string;
    }) {
        // 1. Create or Find Shadow User for Walk-In
        const pseudoEmail = `walkin_${Date.now()}@local.tempus`;
        const randomGuestUid = `kiosk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const client = await this.prisma.user.create({
            data: {
                firebaseUid: randomGuestUid,
                email: pseudoEmail,
                firstName: data.firstName,
                lastName: data.lastName || '',
                phone: data.phone,
                role: 'CLIENT',
            }
        });

        // 2. Extract Service Metadata
        const service = await this.prisma.service.findUnique({
            where: { id: data.serviceId }
        });
        if (!service) throw new NotFoundException('Servicio no encontrado');

        // 3. Calculate ETA (Estimated Time of Arrival / Wait Time)
        // Rule: Sum remaining time of IN_PROGRESS bookings + duration of WAITING people
        const activeBookings = await this.prisma.booking.findMany({
            where: {
                businessId: data.businessId,
                status: 'IN_PROGRESS'
            }
        });

        const waitingQueue = await this.prisma.waitlistEntry.findMany({
            where: {
                businessId: data.businessId,
                status: 'WAITING'
            },
            include: { service: true }
        });

        // Calculate load (simplified basic model for one single queue)
        let totalWaitMs = 0;

        // Sum active work
        const now = Date.now();
        activeBookings.forEach(ab => {
            const remaining = ab.endTime.getTime() - now;
            if (remaining > 0) totalWaitMs += remaining;
        });

        // Sum people ahead in line
        waitingQueue.forEach(wq => {
            totalWaitMs += (wq.service.durationMinutes * 60 * 1000);
        });

        // Ensure minimum wait time of 0 (Immediate)
        const estimatedWaitMinutes = Math.max(0, Math.floor(totalWaitMs / 1000 / 60));

        // Generate projected call time
        const projectedCallTime = new Date(now + totalWaitMs);

        // 4. Register Position in Queue
        const entry = await this.prisma.waitlistEntry.create({
            data: {
                businessId: data.businessId,
                clientId: client.id,
                serviceId: data.serviceId,
                preferredDate: projectedCallTime,
                status: 'WAITING'
            },
            include: {
                client: { select: { firstName: true, lastName: true } },
                service: { select: { name: true, durationMinutes: true } }
            }
        });

        return {
            waitlistEntry: entry,
            estimatedWaitMinutes,
            peopleAhead: waitingQueue.length,
            message: estimatedWaitMinutes === 0 ? '¡Es tu turno!' : `Tiempo de espera aprox: ${estimatedWaitMinutes} min.`
        };
    }

    // ==========================================
    // Advanced Operations: Waitlist & Cascade
    // ==========================================

    async getWaitlistByBusiness(businessId: string) {
        return this.prisma.waitlistEntry.findMany({
            where: {
                businessId,
                status: 'WAITING'
            },
            include: {
                client: { select: { id: true, firstName: true, lastName: true, phone: true } },
                service: { select: { id: true, name: true, durationMinutes: true } }
            },
            orderBy: { createdAt: 'asc' }
        });
    }

    async joinWaitlist(data: { businessId: string; clientId: string; serviceId: string; preferredDate: Date }) {
        // Enforce max 3 active waitlist entries per client per business to prevent spam
        const activeEntries = await this.prisma.waitlistEntry.count({
            where: {
                businessId: data.businessId,
                clientId: data.clientId,
                status: 'WAITING'
            }
        });

        if (activeEntries >= 3) {
            throw new BadRequestException('Maximum waitlist entries reached for this business.');
        }

        return this.prisma.waitlistEntry.create({
            data: {
                businessId: data.businessId,
                clientId: data.clientId,
                serviceId: data.serviceId,
                preferredDate: new Date(data.preferredDate),
                status: 'WAITING'
            }
        });
    }

    async updateWaitlistStatus(id: string, status: 'OFFERED' | 'ACCEPTED' | 'WAITING') {
        const entry = await this.prisma.waitlistEntry.findUnique({ where: { id } });
        if (!entry) throw new NotFoundException('Entrada a la fila no encontrada');

        const updateData: any = { status };
        if (status === 'OFFERED') {
            updateData.notifiedAt = new Date();
            updateData.expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        }

        return this.prisma.waitlistEntry.update({
            where: { id },
            data: updateData
        });
    }

    /**
     * Tetris / Cascade Engine: Scans the waitlist for potential matches when a slot is freed.
     * This is an automated background process triggered upon CANCELLATION.
     */
    private async processWaitlistOnCancellation(cancelledBooking: any) {
        const { businessId, serviceId, startTime, endTime } = cancelledBooking;

        // 1. Find all WAITING users for this Business that want this EXACT service
        // Core Fix: Instead of matching anyone on the same *day*, we match millimetrically.
        // We allow a flexible window of +/- 30 minutes from the freed slot's start time,
        // because clients are usually willing to adjust slightly if a spot opens up.
        const flexibleStartPoint = new Date(startTime.getTime() - 30 * 60 * 1000); // -30 mins
        const flexibleEndPoint = new Date(startTime.getTime() + 30 * 60 * 1000);   // +30 mins

        const waitlistCandidates = await this.prisma.waitlistEntry.findMany({
            where: {
                businessId: businessId,
                serviceId: serviceId,
                status: 'WAITING',
                preferredDate: {
                    gte: flexibleStartPoint,
                    lte: flexibleEndPoint
                }
            },
            orderBy: { createdAt: 'asc' }, // FIFO: Priority to those who waited longest
            take: 5  // Fetch top 5 to attempt optimistic locking
        });

        if (waitlistCandidates.length === 0) {
            return; // No eligible candidates for this precise time slot
        }

        // 2. Optimistic Concurrency Lock (Rate Limiting & Race Condition Prevention)
        // If 5 bookings are cancelled at the identical millisecond, they will all fetch the
        // same top candidate. We use `updateMany` with `status: 'WAITING'` to atomically
        // claim the candidate. The DB guarantees only one transaction will succeed.
        for (const candidate of waitlistCandidates) {
            const lockResult = await this.prisma.waitlistEntry.updateMany({
                where: {
                    id: candidate.id,
                    status: 'WAITING' // Crucial: Only lock if still waiting
                },
                data: {
                    status: 'OFFERED',
                    notifiedAt: new Date(),
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 mins to claim the slot
                }
            });

            if (lockResult.count > 0) {
                // We successfully acquired the lock! The slot is offered to this user.
                console.log(`[Waitlist Engine] Cascade Offer triggered for Client ${candidate.clientId} - Waitlist ID: ${candidate.id}`);

                // TODO (Push Module): await this.pushNotificationService.sendWaitlistOffer(...)

                // Exit the cascade process since the slot is now provisionally taken
                return;
            }
        }
    }
}

