import { IsString, IsNumber, IsOptional, IsUUID, IsEnum, IsArray } from 'class-validator';
import { QuotationStatus } from '@prisma/client';

export class CreateQuotationDto {
    @IsUUID()
    businessId!: string;

    @IsUUID()
    clientId!: string;

    @IsUUID()
    @IsOptional()
    vehicleId?: string;

    @IsUUID()
    @IsOptional()
    workOrderId?: string;

    @IsNumber()
    totalAmount!: number;

    @IsArray()
    items!: any[];

    @IsString()
    @IsOptional()
    notes?: string;

    @IsOptional()
    expiresAt?: Date;
}

export class UpdateQuotationStatusDto {
    @IsEnum(QuotationStatus)
    status!: QuotationStatus;
}
