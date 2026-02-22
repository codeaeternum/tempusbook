import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsNumber, IsEnum, IsObject, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum LoyaltyType {
    STAMPS = 'STAMPS',
    POINTS = 'POINTS',
    TIERS = 'TIERS'
}

export class CreateLoyaltyProgramDto {
    @IsString()
    @IsNotEmpty()
    businessId!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(LoyaltyType)
    type!: LoyaltyType;

    @IsObject()
    config!: Record<string, any>;

    @IsBoolean()
    @IsOptional()
    enabled?: boolean;
}

export class UpdateLoyaltyProgramDto {
    @IsObject()
    @IsOptional()
    config?: Record<string, any>;

    @IsBoolean()
    @IsOptional()
    enabled?: boolean;
}

export class CreateLoyaltyRewardDto {
    @IsString()
    @IsNotEmpty()
    businessId!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsNumber()
    @Min(1)
    pointsCost!: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateLoyaltyRewardDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @Min(1)
    @IsOptional()
    pointsCost?: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
