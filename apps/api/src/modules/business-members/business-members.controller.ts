import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessMembersService } from './business-members.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CreateBusinessMemberDto, UpdateBusinessMemberDto } from './dto/business-members.dto';

@ApiTags('Business Members')
@Controller('business-members')
@UseGuards(FirebaseAuthGuard)
export class BusinessMembersController {
    constructor(private readonly membersService: BusinessMembersService) { }

    @Public()
    @Get('business/:businessId')
    async findByBusiness(@Param('businessId') businessId: string) {
        return this.membersService.findByBusiness(businessId);
    }

    @ApiBearerAuth()
    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.membersService.findById(id);
    }

    @ApiBearerAuth()
    @Post()
    async create(@Body() body: CreateBusinessMemberDto) {
        return this.membersService.create(body);
    }

    @ApiBearerAuth()
    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: UpdateBusinessMemberDto) {
        return this.membersService.update(id, body);
    }

    @ApiBearerAuth()
    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.membersService.delete(id);
    }
}
