import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { PackagesService } from './packages.service';
import { CreatePackageDto, AssignPackageToClientDto, DeductSessionDto } from './dto/packages.dto';

@ApiTags('Packages')
@ApiBearerAuth()
@Controller('packages')
@UseGuards(FirebaseAuthGuard)
export class PackagesController {
    constructor(private readonly packagesService: PackagesService) { }

    // =======================================
    // B2B Catalog Operations
    // =======================================
    @Post()
    async createPackage(@Body() body: CreatePackageDto) {
        return this.packagesService.createPackage(body);
    }

    @Get('business/:businessId')
    async getPackages(@Param('businessId') businessId: string) {
        return this.packagesService.getPackagesByBusiness(businessId);
    }

    @Patch(':id')
    async updatePackage(@Param('id') id: string, @Body() body: Partial<CreatePackageDto>) {
        return this.packagesService.updatePackage(id, body);
    }

    // =======================================
    // B2C Wallet / Ownership Operations
    // =======================================
    @Post('assign')
    async assignPackageToClient(@Body() body: AssignPackageToClientDto) {
        return this.packagesService.assignToClient(body);
    }

    @Get('client/:clientId/business/:businessId')
    async getClientPackages(
        @Param('clientId') clientId: string,
        @Param('businessId') businessId: string
    ) {
        return this.packagesService.getClientPackages(businessId, clientId);
    }

    @Post('client-package/:id/deduct')
    async deductSession(
        @Param('id') id: string,
        @Body() body: DeductSessionDto
    ) {
        return this.packagesService.deductSession(id, body);
    }
}
