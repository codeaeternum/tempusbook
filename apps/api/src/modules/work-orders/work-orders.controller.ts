import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-orders.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('WorkOrders')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('work-orders')
export class WorkOrdersController {
    constructor(private readonly workOrdersService: WorkOrdersService) { }

    @Post()
    create(@Body() createWorkOrderDto: CreateWorkOrderDto) {
        return this.workOrdersService.create(createWorkOrderDto);
    }

    @Get('business/:businessId')
    findByBusiness(@Param('businessId') businessId: string) {
        return this.workOrdersService.findByBusiness(businessId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.workOrdersService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateWorkOrderDto: UpdateWorkOrderDto) {
        return this.workOrdersService.update(id, updateWorkOrderDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.workOrdersService.remove(id);
    }
}
