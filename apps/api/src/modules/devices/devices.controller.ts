import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/devices.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('devices')
export class DevicesController {
    constructor(private readonly devicesService: DevicesService) { }

    @Post()
    create(@Body() createDeviceDto: CreateDeviceDto) {
        return this.devicesService.create(createDeviceDto);
    }

    @Get('business/:businessId')
    findByBusiness(@Param('businessId') businessId: string) {
        return this.devicesService.findByBusiness(businessId);
    }

    @Get('client/:clientId')
    findByClient(@Param('clientId') clientId: string) {
        return this.devicesService.findByClient(clientId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.devicesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
        return this.devicesService.update(id, updateDeviceDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.devicesService.remove(id);
    }
}
