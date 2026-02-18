import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Public()
    @Get()
    async findAll() {
        return this.categoriesService.findAll();
    }

    @Public()
    @Get(':slug')
    async findBySlug(@Param('slug') slug: string) {
        return this.categoriesService.findBySlug(slug);
    }
}
