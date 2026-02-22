import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    OpenShiftDto,
    CloseShiftDto,
    CheckoutDto,
} from './dto/pos.dto';
import { PrismaClient, Prisma } from '@prisma/client';

type TxClient = Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class PosService {
    constructor(private readonly prisma: PrismaService) { }

    // ==========================================
    // Cash Shifts (Z-Reports)
    // ==========================================

    async openShift(dto: OpenShiftDto) {
        // Check if there is already an open shift for this branch/business
        const existingShift = await this.prisma.cashShift.findFirst({
            where: {
                businessId: dto.businessId,
                branchId: dto.branchId,
                status: 'OPEN',
            },
        });

        if (existingShift) {
            throw new BadRequestException('A cash shift is already open for this location.');
        }

        return this.prisma.cashShift.create({
            data: {
                businessId: dto.businessId,
                branchId: dto.branchId,
                openedById: dto.openedById,
                startingCash: dto.startingCash,
                // expectedCash will start identical to startingCash
                expectedCash: dto.startingCash,
            },
        });
    }

    async closeShift(dto: CloseShiftDto) {
        const shift = await this.prisma.cashShift.findUnique({
            where: { id: dto.shiftId },
        });

        if (!shift) {
            throw new NotFoundException('Cash shift not found.');
        }
        if (shift.status === 'CLOSED') {
            throw new BadRequestException('This cash shift is already closed.');
        }

        // Update the shift
        return this.prisma.cashShift.update({
            where: { id: dto.shiftId },
            data: {
                status: 'CLOSED',
                closedById: dto.closedById,
                closedAt: new Date(),
                actualCash: dto.actualCash,
                notes: dto.notes,
            },
        });
    }

    async getActiveShift(businessId: string, branchId?: string) {
        return this.prisma.cashShift.findFirst({
            where: {
                businessId,
                branchId,
                status: 'OPEN',
            },
        });
    }

    // ==========================================
    // Fetching Catalog & Clients
    // ==========================================

    async getCatalog(businessId: string) {
        const [services, products] = await Promise.all([
            this.prisma.service.findMany({ where: { businessId, isActive: true } }),
            this.prisma.product.findMany({
                where: { businessId, isActive: true },
                include: { stocks: true }
            }),
        ]);

        const catalog = [
            ...services.map(s => ({
                id: s.id,
                name: s.name,
                price: Number(s.price),
                category: 'service',
                icon: '💼',
                duration: s.durationMinutes,
            })),
            ...products.map(p => ({
                id: p.id,
                name: p.name,
                price: Number(p.price),
                category: 'product',
                icon: '📦',
                stock: p.stocks.reduce((acc, stock) => acc + stock.quantity, 0),
            })),
        ];

        return catalog;
    }

    async getClients(businessId: string) {
        // In the MVP, we filter global users who are CLIENTS
        const users = await this.prisma.user.findMany({
            where: { role: 'CLIENT' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
            },
        });

        return users.map(u => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`.trim(),
            phone: u.phone || 'N/A',
        }));
    }

    // ==========================================
    // Checkout & Transactions (ACID)
    // ==========================================

    async checkout(dto: CheckoutDto) {
        // 1. Verify Business and Category Settings
        const business = await this.prisma.business.findUnique({
            where: { id: dto.businessId },
            include: { category: true },
        });

        if (!business) {
            throw new NotFoundException('Business not found.');
        }

        // Prisma JSON arrays sometimes come back as objects or stringified if not typed precisely.
        // We ensure it's an array before checking.
        let enabledModules: string[] = [];
        console.log('--- DEBUG: Raw enabledModules type:', typeof business.category?.enabledModules);
        console.log('--- DEBUG: Raw enabledModules value:', business.category?.enabledModules);

        if (Array.isArray(business.category?.enabledModules)) {
            enabledModules = business.category.enabledModules as string[];
        } else if (typeof business.category?.enabledModules === 'string') {
            try {
                enabledModules = JSON.parse(business.category.enabledModules);
            } catch (e) {
                enabledModules = [];
            }
        }

        console.log('--- DEBUG: Parsed enabledModules:', enabledModules);
        const requiresShift = enabledModules.includes('CASH_SHIFTS');
        console.log('--- DEBUG: requiresShift evaluated to:', requiresShift);

        // 2. ACID Transaction Layer
        return this.prisma.$transaction(async (tx) => {
            // Validate Shift if required by the business category
            let activeShiftId = dto.shiftId;
            if (requiresShift) {
                if (!activeShiftId) {
                    throw new BadRequestException('This business requires an active Cash Shift to process sales.');
                }

                const shift = await tx.cashShift.findUnique({
                    where: { id: activeShiftId },
                });

                if (!shift || shift.status !== 'OPEN') {
                    throw new BadRequestException('The provided cash shift is invalid or already closed.');
                }
            }

            // 3. Deduct Inventory (ProductStock) for each physical product sold
            for (const item of dto.items) {
                if (item.productId) {
                    // Find stock for the primary branch (or specific one in a multi-branch setup)
                    // Since the MVP might not pass branchId deeply yet, we pick the first available stock
                    // In a production app, branchId should be strictly tied.
                    const stock = await tx.productStock.findFirst({
                        where: {
                            productId: item.productId,
                            branch: { businessId: dto.businessId },
                        },
                    });

                    if (!stock) {
                        throw new BadRequestException(`No stock record found for product: ${item.name}`);
                    }
                    if (stock.quantity < item.qty) {
                        throw new BadRequestException(`Insufficient stock for product: ${item.name}. Available: ${stock.quantity}`);
                    }

                    // Deduct
                    await tx.productStock.update({
                        where: { id: stock.id },
                        data: { quantity: { decrement: item.qty } },
                    });
                }
            }

            // 4. Create the Sale Record
            const sale = await tx.sale.create({
                data: {
                    businessId: dto.businessId,
                    clientId: dto.clientId,
                    staffId: dto.staffId,
                    shiftId: activeShiftId,
                    subtotal: dto.subtotal,
                    discount: dto.discount,
                    total: dto.total,
                    paymentMethod: dto.paymentMethod as any,
                    cashGiven: dto.cashGiven,
                    metadata: dto.metadata || {},
                    status: 'COMPLETED',
                    // Create items inside the same query
                    items: {
                        create: dto.items.map(item => ({
                            productId: item.productId,
                            serviceId: item.serviceId,
                            name: item.name,
                            qty: item.qty,
                            unitPrice: item.unitPrice,
                            discount: item.discount,
                            totalPrice: item.totalPrice,
                            note: item.note,
                        })),
                    },
                },
            });

            // 5. Create the Payment Record
            await tx.payment.create({
                data: {
                    saleId: sale.id,
                    businessId: dto.businessId,
                    amount: dto.total,
                    currency: business.currency || 'MXN',
                    type: 'FULL',
                    status: 'COMPLETED',
                },
            });

            // 6. If Cash Shift is active and payment is in CASH, increment the expected cash in drawer
            if (activeShiftId && (dto.paymentMethod === 'CASH' || dto.paymentMethod === 'MIXED')) {
                // For MVP, if it involves cash, we increment the expected cash drawer by the entire total
                await tx.cashShift.update({
                    where: { id: activeShiftId },
                    data: { expectedCash: { increment: dto.total } },
                });
            }

            // 7. SINERGIA 3: POS -> Loyalty Automático
            // Si el cliente está identificado, le inyectamos beneficios de lealtad (Puntos o Sellos)
            if (dto.clientId) {
                // Check if Business has an Active Loyalty Program
                const program = await tx.loyaltyProgram.findFirst({
                    where: { businessId: dto.businessId, enabled: true }
                });

                if (program) {
                    // Try to fetch existing LoyaltyCard
                    let card = await tx.loyaltyCard.findUnique({
                        where: { loyaltyProgramId_clientId: { loyaltyProgramId: program.id, clientId: dto.clientId } }
                    });

                    // If it doesn't exist, create it automatically
                    if (!card) {
                        card = await tx.loyaltyCard.create({
                            data: {
                                loyaltyProgramId: program.id,
                                clientId: dto.clientId,
                            }
                        });
                    }

                    // Calculate Rewards
                    // Let's assume Points Type yields 1 point for every $10 MXN spent.
                    const pointsGained = program.type === 'POINTS' ? Math.floor(dto.total / 10) : 0;
                    // Let's assume Stamps Type yields 1 stamp per standalone checkout
                    const stampsGained = program.type === 'STAMPS' ? 1 : 0;

                    // Update balances natively
                    await tx.loyaltyCard.update({
                        where: { id: card.id },
                        data: {
                            visits: { increment: 1 },
                            totalSpent: { increment: dto.total },
                            points: { increment: pointsGained },
                            stamps: { increment: stampsGained },
                            lastVisit: new Date()
                        }
                    });

                    // Añadir un tracking metadato al SALE para que el frontend lo pueda mostrar en el Recibo
                    await tx.sale.update({
                        where: { id: sale.id },
                        data: {
                            metadata: {
                                ...sale.metadata as object,
                                loyaltyAwarded: true,
                                pointsGained,
                                stampsGained
                            }
                        }
                    });
                }
            }

            return sale;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); // Strict Isolation Level to prevent Race Conditions with Inventory
    }

    // ==========================================
    // Synergy: Booking -> POS Draft
    // ==========================================

    async createDraftSaleFromBooking(dto: {
        businessId: string;
        staffId: string;
        bookingId: string;
        shiftId?: string;
    }) {
        // 1. Validate Business & Modules
        const business = await this.prisma.business.findUnique({
            where: { id: dto.businessId },
            include: { category: true }
        });

        if (!business) {
            throw new NotFoundException('Business not found.');
        }

        let enabledModules: string[] = [];
        if (Array.isArray(business.category?.enabledModules)) {
            enabledModules = business.category.enabledModules as string[];
        } else if (typeof business.category?.enabledModules === 'string') {
            try {
                enabledModules = JSON.parse(business.category.enabledModules);
            } catch (e) {
                enabledModules = [];
            }
        }

        const requiresShift = enabledModules.includes('CASH_SHIFTS');

        return this.prisma.$transaction(async (tx) => {
            // 2. Shift Validation (if required)
            if (requiresShift) {
                if (!dto.shiftId) {
                    throw new BadRequestException('This business requires an active Cash Shift to process sales.');
                }

                const shift = await tx.cashShift.findUnique({
                    where: { id: dto.shiftId },
                });

                if (!shift || shift.status !== 'OPEN') {
                    throw new BadRequestException('The provided cash shift is invalid or already closed.');
                }
            }

            // 3. Get the Booking Details
            const booking = await tx.booking.findUnique({
                where: { id: dto.bookingId },
                include: { service: true }
            });

            if (!booking) {
                throw new NotFoundException('Booking not found.');
            }

            // 4. Extract Total and Create the Draft (PENDING) Sale
            // By default, the subtotal is the total price of the service.
            // PENDING sales mean it lives in the cart (so the cashier can add tips or extra products)
            const servicePrice = Number(booking.service.price);

            const draftSale = await tx.sale.create({
                data: {
                    businessId: dto.businessId,
                    clientId: booking.clientId,
                    staffId: dto.staffId, // The cashier checking out the order
                    shiftId: dto.shiftId || null,
                    subtotal: servicePrice,
                    discount: 0,
                    total: servicePrice,
                    status: 'PENDING', // Key diff: This is NOT completed
                    paymentMethod: 'CASH', // Placeholder, changes on true checkout
                    metadata: { linkedBookingId: dto.bookingId },
                    // 5. Pre-load the Service item into the Cart
                    items: {
                        create: [{
                            serviceId: booking.service.id,
                            name: booking.service.name,
                            qty: 1,
                            unitPrice: servicePrice,
                            discount: 0,
                            totalPrice: servicePrice,
                            note: `Autogenerado desde Cita ID: ${booking.id.split('-')[0]}`
                        }]
                    }
                },
                include: { items: true, client: true }
            });

            // 6. Automatically Mark the Booking as 'COMPLETED' now that it's in the Cart
            await tx.booking.update({
                where: { id: dto.bookingId },
                data: { status: 'COMPLETED' }
            });

            return draftSale;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    }
}
