import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IssueGiftCardDto, RedeemGiftCardDto } from './dto/gift-cards.dto';
import * as crypto from 'crypto';

@Injectable()
export class GiftCardsService {
    constructor(private prisma: PrismaService) { }

    private generateCode(): string {
        const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `AE-${hex.slice(0, 4)}-${hex.slice(4)}`;
    }

    async issueCard(data: IssueGiftCardDto) {
        let code = this.generateCode();
        // Ensure uniqueness using a simple collision retry
        let existing = await this.prisma.giftCard.findUnique({ where: { code } });
        while (existing) {
            code = this.generateCode();
            existing = await this.prisma.giftCard.findUnique({ where: { code } });
        }

        let expiresAt = null;
        if (data.expiresInDays) {
            const date = new Date();
            date.setDate(date.getDate() + data.expiresInDays);
            expiresAt = date;
        }

        return this.prisma.giftCard.create({
            data: {
                businessId: data.businessId,
                code,
                initialBalance: data.initialBalance,
                currentBalance: data.initialBalance,
                purchaserId: data.purchaserId,
                recipientName: data.recipientName,
                expiresAt,
                status: 'ACTIVE'
            }
        });
    }

    async getBusinessCards(businessId: string) {
        return this.prisma.giftCard.findMany({
            where: { businessId },
            orderBy: { createdAt: 'desc' },
            include: {
                purchaser: { select: { firstName: true, lastName: true } }
            }
        });
    }

    async checkBalance(code: string, businessId: string) {
        const card = await this.prisma.giftCard.findUnique({ where: { code } });
        if (!card) throw new NotFoundException('Tarjeta de Regalo no encontrada');
        if (card.businessId !== businessId) throw new BadRequestException('Esta tarjeta pertenece a otro comercio o franquicia');

        return card;
    }

    async deductBalance(data: RedeemGiftCardDto) {
        const card = await this.prisma.giftCard.findUnique({ where: { code: data.code } });

        if (!card) throw new NotFoundException('Tarjeta no encontrada');
        if (card.businessId !== data.businessId) throw new BadRequestException('La tarjeta pertenece a otro negocio');
        if (card.status !== 'ACTIVE') throw new BadRequestException(`Tarjeta inhabilitada. Estado actual: ${card.status}`);

        if (card.expiresAt && card.expiresAt < new Date()) {
            await this.prisma.giftCard.update({ where: { id: card.id }, data: { status: 'EXPIRED' } });
            throw new BadRequestException('La vigencia de estra Tarjeta de Regalo ha expirado');
        }

        if (Number(card.currentBalance) < data.amountToDeduct) {
            throw new BadRequestException(`Saldo insuficiente. La tarjeta cuenta únicamente con $${Number(card.currentBalance).toFixed(2)} MXN.`);
        }

        // Apply strict ACID transactional block to deduct money efficiently maintaining Ledger Integrity
        return this.prisma.$transaction(async (tx) => {
            const newBalance = Number(card.currentBalance) - data.amountToDeduct;
            const newStatus = newBalance <= 0 ? 'DEPLETED' : 'ACTIVE';

            const updatedCard = await tx.giftCard.update({
                where: { id: card.id },
                data: {
                    currentBalance: newBalance,
                    status: newStatus,
                    lastUsedAt: new Date()
                }
            });

            return updatedCard;
        });
    }
}
