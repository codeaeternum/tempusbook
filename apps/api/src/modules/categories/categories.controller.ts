import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CategoriesService } from './categories.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(FirebaseAuthGuard)
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
