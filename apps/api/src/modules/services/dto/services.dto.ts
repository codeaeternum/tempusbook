import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min, IsUUID } from 'class-validator';

export class CreateServiceDto {
    @IsUUID()
    @IsNotEmpty()
    businessId!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(1)
    durationMinutes!: number;

    @IsNumber()
    @Min(0)
    price!: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsBoolean()
    @IsOptional()
    isGroup?: boolean;

    @IsNumber()
    @Min(2)
    @IsOptional()
    maxCapacity?: number;
}

export class UpdateServiceDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(1)
    @IsOptional()
    durationMinutes?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    price?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsBoolean()
    @IsOptional()
    isGroup?: boolean;

    @IsNumber()
    @Min(2)
    @IsOptional()
    maxCapacity?: number;
}
