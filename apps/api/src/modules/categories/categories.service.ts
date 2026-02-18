import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.category.findMany({
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: { select: { businesses: true } },
            },
        });
    }

    async findBySlug(slug: string) {
        return this.prisma.category.findUnique({
            where: { slug },
            include: {
                businesses: {
                    where: { status: 'ACTIVE' },
                    take: 20,
                    orderBy: { avgRating: 'desc' },
                },
            },
        });
    }
}
