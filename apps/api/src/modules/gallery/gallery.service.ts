import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAlbumDto, AddImageDto, AddAnnotationsDto } from './dto/gallery.dto';

@Injectable()
export class GalleryService {
    constructor(private prisma: PrismaService) { }

    // 1. ALBUMS
    async createAlbum(data: CreateAlbumDto) {
        return this.prisma.galleryAlbum.create({
            data: {
                businessId: data.businessId,
                clientId: data.clientId,
                name: data.name,
                description: data.description,
            }
        });
    }

    async getClientAlbums(clientId: string, businessId: string) {
        return this.prisma.galleryAlbum.findMany({
            where: { clientId, businessId },
            include: {
                images: {
                    include: { annotations: true },
                    orderBy: { uploadedAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async deleteAlbum(id: string) {
        return this.prisma.galleryAlbum.delete({ where: { id } });
    }

    // 2. IMAGES
    async addImage(data: AddImageDto) {
        return this.prisma.galleryImage.create({
            data: {
                albumId: data.albumId,
                url: data.url,
                thumbnailUrl: data.thumbnailUrl,
                notes: data.notes
            }
        });
    }

    async deleteImage(id: string) {
        return this.prisma.galleryImage.delete({ where: { id } });
    }

    // 3. ANNOTATIONS (The Medical Canvas Core)
    async addAnnotations(data: AddAnnotationsDto) {
        // Ensure image exists
        const img = await this.prisma.galleryImage.findUnique({ where: { id: data.imageId } });
        if (!img) throw new NotFoundException('Clinical photograph not found for annotation');

        // Delete existing ones to allow "saving state" from Canvas re-draws cleanly
        await this.prisma.imageAnnotation.deleteMany({ where: { imageId: data.imageId } });

        // Insert new array of 2D Vectors mapped to this image
        if (data.annotations && data.annotations.length > 0) {
            await this.prisma.imageAnnotation.createMany({
                data: data.annotations.map(a => ({
                    imageId: data.imageId,
                    x: a.x,
                    y: a.y,
                    note: a.note,
                    color: a.color || '#10b981'
                }))
            });
        }

        // Return updated image payload
        return this.prisma.galleryImage.findUnique({
            where: { id: data.imageId },
            include: { annotations: true }
        });
    }
}
