import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { BusinessesService } from './businesses.service';

@ApiTags('Businesses')
@Controller('businesses')
export class BusinessesController {
    constructor(private readonly businessesService: BusinessesService) { }

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
    async create(@Body() body: any, @Req() req: any) {
        return this.businessesService.create(body, req.user.uid);
    }

    @ApiBearerAuth()
    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: any) {
        return this.businessesService.update(id, body);
    }
}
