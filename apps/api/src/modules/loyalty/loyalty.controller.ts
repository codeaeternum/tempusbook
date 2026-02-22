import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { CreateLoyaltyProgramDto, UpdateLoyaltyProgramDto, CreateLoyaltyRewardDto, UpdateLoyaltyRewardDto } from './dto/loyalty.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

import { PlanGuard } from '../auth/plan.guard';
import { RequirePlan } from '../auth/decorators/plan.decorator';

@Controller('loyalty')
@UseGuards(FirebaseAuthGuard, PlanGuard)
@RequirePlan('PRO')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) { }

  // --- Programs ---
  @Get('programs')
  getPrograms(@Query('businessId') businessId: string) {
    return this.loyaltyService.getPrograms(businessId);
  }

  @Post('programs')
  createProgram(@Body() createDto: CreateLoyaltyProgramDto) {
    return this.loyaltyService.createProgram(createDto);
  }

  @Patch('programs/:id')
  updateProgram(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @Body() updateDto: UpdateLoyaltyProgramDto
  ) {
    return this.loyaltyService.updateProgram(id, businessId, updateDto);
  }

  // --- Members ---
  @Get('members')
  getMembers(@Query('businessId') businessId: string) {
    return this.loyaltyService.getMembers(businessId);
  }

  // --- Rewards ---
  @Get('rewards')
  getRewards(@Query('businessId') businessId: string) {
    return this.loyaltyService.getRewards(businessId);
  }

  @Post('rewards')
  createReward(@Body() createDto: CreateLoyaltyRewardDto) {
    return this.loyaltyService.createReward(createDto);
  }

  @Patch('rewards/:id')
  updateReward(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @Body() updateDto: UpdateLoyaltyRewardDto
  ) {
    return this.loyaltyService.updateReward(id, businessId, updateDto);
  }

  @Delete('rewards/:id')
  deleteReward(@Param('id') id: string, @Query('businessId') businessId: string) {
    return this.loyaltyService.deleteReward(id, businessId);
  }
}
