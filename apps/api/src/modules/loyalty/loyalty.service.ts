import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLoyaltyProgramDto, UpdateLoyaltyProgramDto, CreateLoyaltyRewardDto, UpdateLoyaltyRewardDto } from './dto/loyalty.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) { }

  // --- Programs ---
  async getPrograms(businessId: string) {
    return this.prisma.loyaltyProgram.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createProgram(createDto: CreateLoyaltyProgramDto) {
    return this.prisma.loyaltyProgram.create({
      data: {
        businessId: createDto.businessId,
        name: createDto.name,
        description: createDto.description,
        type: createDto.type,
        config: createDto.config as unknown as Prisma.InputJsonValue,
        enabled: createDto.enabled ?? true
      }
    });
  }

  async updateProgram(id: string, businessId: string, updateDto: UpdateLoyaltyProgramDto) {
    const program = await this.prisma.loyaltyProgram.findFirst({
      where: { id, businessId }
    });

    if (!program) throw new NotFoundException('Program not found');

    const updatedConfig = updateDto.config
      ? { ...(program.config as Record<string, any>), ...updateDto.config }
      : program.config;

    return this.prisma.loyaltyProgram.update({
      where: { id },
      data: {
        enabled: updateDto.enabled !== undefined ? updateDto.enabled : program.enabled,
        config: updatedConfig as unknown as Prisma.InputJsonValue
      }
    });
  }

  // --- Members (Cards) ---
  async getMembers(businessId: string) {
    return this.prisma.loyaltyCard.findMany({
      where: {
        program: { businessId }
      },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, phone: true }
        }
      },
      orderBy: { points: 'desc' }
    });
  }

  // --- Rewards ---
  async getRewards(businessId: string) {
    return this.prisma.loyaltyReward.findMany({
      where: { businessId },
      orderBy: { pointsCost: 'asc' }
    });
  }

  async createReward(createDto: CreateLoyaltyRewardDto) {
    return this.prisma.loyaltyReward.create({
      data: createDto
    });
  }

  async updateReward(id: string, businessId: string, updateDto: UpdateLoyaltyRewardDto) {
    await this.checkRewardExists(id, businessId);
    return this.prisma.loyaltyReward.update({
      where: { id },
      data: updateDto
    });
  }

  async deleteReward(id: string, businessId: string) {
    await this.checkRewardExists(id, businessId);
    return this.prisma.loyaltyReward.delete({
      where: { id }
    });
  }

  private async checkRewardExists(id: string, businessId: string) {
    const reward = await this.prisma.loyaltyReward.findFirst({
      where: { id, businessId }
    });
    if (!reward) throw new NotFoundException('Reward not found');
  }
}
