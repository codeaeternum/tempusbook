import { IsString, IsNumber, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateProductDto {
    @IsUUID()
    businessId!: string;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    sku?: string;

    @IsOptional()
    @IsString()
    barcode?: string;

    @IsOptional()
    @IsNumber()
    costPrice?: number;

    @IsNumber()
    price!: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsNumber()
    initialStock?: number;

    @IsOptional()
    @IsNumber()
    minStock?: number;

    @IsOptional()
    @IsUUID()
    branchId?: string;
}

export class UpdateProductDto {
    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    sku?: string;

    @IsOptional()
    @IsString()
    barcode?: string;

    @IsOptional()
    @IsNumber()
    costPrice?: number;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsNumber()
    minStock?: number;
}

export class AdjustStockDto {
    @IsNumber()
    quantityDelta!: number; // e.g. 5, -3

    @IsString()
    @IsOptional()
    reason?: string;

    @IsOptional()
    @IsUUID()
    branchId?: string;
}
