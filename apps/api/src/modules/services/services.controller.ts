import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { ServicesService } from './services.service';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) { }

    @Public()
    @Get('business/:businessId')
    async findByBusiness(@Param('businessId') businessId: string) {
        return this.servicesService.findByBusiness(businessId);
    }

    @Public()
    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.servicesService.findById(id);
    }

    @ApiBearerAuth()
    @Post()
    async create(@Body() body: any) {
        return this.servicesService.create(body);
    }

    @ApiBearerAuth()
    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: any) {
        return this.servicesService.update(id, body);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.servicesService.delete(id);
    }
}
