import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackageDto, AssignPackageToClientDto, DeductSessionDto } from './dto/packages.dto';

@Injectable()
export class PackagesService {
    constructor(private prisma: PrismaService) { }

    // ==========================================
    // B2B Menu: Packages Definition
    // ==========================================

    async createPackage(data: CreatePackageDto) {
        return this.prisma.package.create({ data });
    }

    async getPackagesByBusiness(businessId: string) {
        return this.prisma.package.findMany({
            where: { businessId, isActive: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updatePackage(id: string, data: Partial<CreatePackageDto>) {
        return this.prisma.package.update({
            where: { id },
            data,
        });
    }

    async togglePackageStatus(id: string, isActive: boolean) {
        return this.prisma.package.update({
            where: { id },
            data: { isActive }
        });
    }

    // ==========================================
    // Client Package Assignments (B2C & POS)
    // ==========================================

    async assignToClient(data: AssignPackageToClientDto) {
        const pkg = await this.prisma.package.findUnique({ where: { id: data.packageId } });
        if (!pkg) throw new NotFoundException('Paquete Base no encontrado');

        let expiresAt = null;
        if (pkg.expiresIn) {
            const date = new Date();
            date.setDate(date.getDate() + pkg.expiresIn);
            expiresAt = date;
        }

        return this.prisma.clientPackage.create({
            data: {
                businessId: data.businessId,
                clientId: data.clientId,
                packageId: data.packageId,
                totalSessions: pkg.sessions,
                usedSessions: 0,
                status: 'ACTIVE',
                expiresAt,
            }
        });
    }

    async getClientPackages(businessId: string, clientId: string) {
        return this.prisma.clientPackage.findMany({
            where: { businessId, clientId },
            include: {
                packageDef: true,
                history: {
                    orderBy: { deductedAt: 'desc' }
                },
                client: { select: { firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async deductSession(clientPackageId: string, data: DeductSessionDto) {
        const cp = await this.prisma.clientPackage.findUnique({
            where: { id: clientPackageId }
        });

        if (!cp) throw new NotFoundException('Paquete prepagado del cliente no encontrado');
        if (cp.status !== 'ACTIVE') throw new BadRequestException(`El paquete está inhabilitado: ${cp.status}`);
        if (cp.usedSessions >= cp.totalSessions) throw new BadRequestException('El paquete ya no tiene cupos disponibles');

        if (cp.expiresAt && cp.expiresAt < new Date()) {
            await this.prisma.clientPackage.update({
                where: { id: cp.id },
                data: { status: 'EXPIRED' }
            });
            throw new BadRequestException('La vigencia de este paquete ha vencido');
        }

        // Atomicity Guarantee: Deduct session securely using Prisma ACID transaction
        return this.prisma.$transaction(async (tx) => {
            const nextUsed = cp.usedSessions + 1;
            const newStatus = nextUsed >= cp.totalSessions ? 'EXHAUSTED' : 'ACTIVE';

            const updatedCp = await tx.clientPackage.update({
                where: { id: cp.id },
                data: {
                    usedSessions: nextUsed,
                    status: newStatus,
                    lastUsedAt: new Date()
                }
            });

            const sessionEntry = await tx.packageSession.create({
                data: {
                    clientPackageId: cp.id,
                    notes: data.notes || `Sesión ${nextUsed} de ${cp.totalSessions}`,
                    bookingId: data.bookingId
                }
            });

            return { updatedClientPackage: updatedCp, sessionEntry };
        });
    }
}
