import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateProductDto, UpdateProductDto, AdjustStockDto } from './dto/inventory.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { PlanGuard } from '../auth/plan.guard';
import { RequirePlan } from '../auth/decorators/plan.decorator';

@UseGuards(FirebaseAuthGuard, PlanGuard)
@RequirePlan('PRO')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Get()
  findAll(
    @Query('businessId') businessId: string,
    @CurrentUser() user: any // User object from FirebaseAuthGuard
  ) {
    // Enforce RBAC in a real app (verify if user belongs to businessId)
    return this.inventoryService.findAll(businessId);
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.inventoryService.create(createProductDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.inventoryService.update(id, updateProductDto);
  }

  @Patch(':id/stock')
  adjustStock(
    @Param('id') id: string,
    @Body() adjustStockDto: AdjustStockDto
  ) {
    return this.inventoryService.adjustStock(id, adjustStockDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }
}
