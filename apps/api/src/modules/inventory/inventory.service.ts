import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, AdjustStockDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) { }

  async findAll(businessId: string) {
    if (!businessId) throw new BadRequestException('businessId is required');

    const products = await this.prisma.product.findMany({
      where: { businessId },
      include: {
        stocks: true, // we fetch all branch stock records
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map(p => {
      // Flatten the response for UI simplicity (assuming single branch MVP or summing up)
      // In a real multi-branch setup, we'd return stocks explicitly arrayed
      const totalStock = p.stocks.reduce((acc, s) => acc + s.quantity, 0);
      const refStock = p.stocks[0];

      return {
        id: p.id,
        businessId: p.businessId,
        categoryId: p.categoryId,
        name: p.name,
        description: p.description,
        sku: p.sku || '',
        barcode: p.barcode || '',
        costPrice: p.costPrice ? Number(p.costPrice) : 0,
        price: Number(p.price),
        currency: p.currency,
        imageUrl: p.imageUrl,
        isActive: p.isActive,
        createdAt: p.createdAt,
        // Virtual calculated fields
        stock: totalStock,
        minStock: refStock?.minStock ?? 5,
      };
    });
  }

  async create(dto: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the Product Base
      const product = await tx.product.create({
        data: {
          businessId: dto.businessId,
          categoryId: dto.categoryId,
          name: dto.name,
          description: dto.description,
          sku: dto.sku,
          barcode: dto.barcode,
          costPrice: dto.costPrice,
          price: dto.price,
          currency: dto.currency || 'MXN',
          imageUrl: dto.imageUrl,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });

      // 2. Resolve default branch if not provided
      let branchId = dto.branchId;
      if (!branchId) {
        let defaultBranch = await tx.branch.findFirst({
          where: { businessId: dto.businessId },
          orderBy: { name: 'asc' }
        });
        if (!defaultBranch) {
          defaultBranch = await tx.branch.create({
            data: {
              businessId: dto.businessId,
              name: 'Sede Principal',
              address: 'Pendiente'
            }
          });
        }
        branchId = defaultBranch.id;
      }

      // 3. Create the Initial Stock Entry for the resolved branch
      if (branchId) {
        await tx.productStock.create({
          data: {
            productId: product.id,
            branchId: branchId,
            quantity: dto.initialStock || 0,
            minStock: dto.minStock || 5,
          },
        });
      }

      return product;
    });
  }

  async update(productId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Base Product
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          categoryId: dto.categoryId,
          name: dto.name,
          description: dto.description,
          sku: dto.sku,
          barcode: dto.barcode,
          costPrice: dto.costPrice,
          price: dto.price,
          imageUrl: dto.imageUrl,
          isActive: dto.isActive,
        },
      });

      // 2. Update MinStock if requested (applies to all branches sequentially in MVP)
      if (dto.minStock !== undefined) {
        await tx.productStock.updateMany({
          where: { productId },
          data: { minStock: dto.minStock },
        });
      }

      return updated;
    });
  }

  async adjustStock(productId: string, dto: AdjustStockDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.$transaction(async (tx) => {
      // Resolve default branch if not provided
      let branchId = dto.branchId;
      if (!branchId) {
        let defaultBranch = await tx.branch.findFirst({
          where: { businessId: product.businessId },
          orderBy: { name: 'asc' }
        });
        if (!defaultBranch) {
          defaultBranch = await tx.branch.create({
            data: {
              businessId: product.businessId,
              name: 'Sede Principal',
              address: 'Pendiente'
            }
          });
        }
        branchId = defaultBranch.id;
      }

      const stock = await tx.productStock.findUnique({
        where: {
          productId_branchId: {
            productId,
            branchId: branchId,
          }
        }
      });

      if (!stock) {
        // If the stock record doesn't exist for this branch, we create it.
        return tx.productStock.create({
          data: {
            productId,
            branchId: branchId,
            quantity: Math.max(0, dto.quantityDelta), // Negative delta on empty stock is 0
            minStock: 5,
          }
        });
      }

      const newQuantity = stock.quantity + dto.quantityDelta;

      if (newQuantity < 0) {
        throw new BadRequestException('Insufficient stock for this operation');
      }

      return tx.productStock.update({
        where: { id: stock.id },
        data: { quantity: newQuantity }
      });
    });
  }

  async remove(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    // We use Cascade delete for Stock automatically (Prisma handles it)
    return this.prisma.product.delete({
      where: { id: productId },
    });
  }
}
