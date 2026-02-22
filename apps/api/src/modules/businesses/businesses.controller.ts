import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { BusinessesService } from './businesses.service';
import { UsersService } from '../users/users.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Businesses')
@Controller('businesses')
@UseGuards(FirebaseAuthGuard)
export class BusinessesController {
    constructor(
        private readonly businessesService: BusinessesService,
        private readonly usersService: UsersService
    ) { }

    @Public()
    @Get()
    async findAll(
        @Query('category') categorySlug?: string,
        @Query('city') city?: string,
        @Query('search') search?: string,
        @Query('page') page?: number,
        @Query('perPage') perPage?: number,
    ) {
        return this.businessesService.findAll({
            categorySlug,
            city,
            search,
            page,
            perPage,
        });
    }

    @Public()
    @Get(':slug')
    async findBySlug(@Param('slug') slug: string) {
        return this.businessesService.findBySlug(slug);
    }

    @ApiBearerAuth()
    @Post()
    async create(@Body() body: any, @CurrentUser() user: any) {
        const dbUser = await this.usersService.findByFirebaseUid(user.uid);
        if (!dbUser) {
            throw new Error('Usuario no sincronizado con base de datos principal');
        }
        return this.businessesService.create(body, dbUser.id);
    }

    @ApiBearerAuth()
    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: any) {
        return this.businessesService.update(id, body);
    }

    @ApiBearerAuth()
    @Get(':businessId/clients')
    async getClients(@Param('businessId') businessId: string) {
        return this.businessesService.getClients(businessId);
    }

    @ApiBearerAuth()
    @Post(':businessId/clients')
    async createClient(@Param('businessId') businessId: string, @Body() body: any) {
        return this.businessesService.createClient(businessId, body);
    }

    @ApiBearerAuth()
    @Patch(':businessId/clients/:clientId')
    async updateClient(
        @Param('businessId') businessId: string,
        @Param('clientId') clientId: string,
        @Body() body: any
    ) {
        return this.businessesService.updateClient(businessId, clientId, body);
    }

    @ApiBearerAuth()
    @Delete(':businessId/clients/:clientId')
    async deleteClient(
        @Param('businessId') businessId: string,
        @Param('clientId') clientId: string
    ) {
        return this.businessesService.deleteClient(businessId, clientId);
    }
}
