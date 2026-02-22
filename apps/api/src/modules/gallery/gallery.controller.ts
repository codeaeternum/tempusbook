import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { GalleryService } from './gallery.service';
import { CreateAlbumDto, AddImageDto, AddAnnotationsDto } from './dto/gallery.dto';

@ApiTags('Gallery')
@ApiBearerAuth()
@Controller('gallery')
@UseGuards(FirebaseAuthGuard)
export class GalleryController {
    constructor(private readonly galleryService: GalleryService) { }

    @Post('albums')
    async createAlbum(@Body() data: CreateAlbumDto) {
        return this.galleryService.createAlbum(data);
    }

    @Get('albums')
    async getClientAlbums(@Query('clientId') clientId: string, @Query('businessId') businessId: string) {
        return this.galleryService.getClientAlbums(clientId, businessId);
    }

    @Delete('albums/:id')
    async deleteAlbum(@Param('id') id: string) {
        return this.galleryService.deleteAlbum(id);
    }

    @Post('images')
    async addImage(@Body() data: AddImageDto) {
        return this.galleryService.addImage(data);
    }

    @Delete('images/:id')
    async deleteImage(@Param('id') id: string) {
        return this.galleryService.deleteImage(id);
    }

    @Put('images/annotations')
    async updateAnnotations(@Body() data: AddAnnotationsDto) {
        return this.galleryService.addAnnotations(data);
    }
}
