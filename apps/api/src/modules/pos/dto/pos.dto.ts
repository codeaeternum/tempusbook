import { Type } from 'class-transformer';
import {
    IsString,
    IsNumber,
    IsOptional,
    IsArray,
    ValidateNested,
    IsEnum,
    Min,
} from 'class-validator';

export enum PaymentMethod {
    CASH = 'CASH',
    CARD = 'CARD',
    TRANSFER = 'TRANSFER',
    MIXED = 'MIXED',
}

export class OpenShiftDto {
    @IsString()
    businessId!: string;

    @IsString()
    openedById!: string; // The staff member ID

    @IsOptional()
    @IsString()
    branchId?: string;

    @IsNumber()
    @Min(0)
    startingCash!: number;
}

export class CloseShiftDto {
    @IsString()
    shiftId!: string;

    @IsString()
    businessId!: string;

    @IsString()
    closedById!: string;

    @IsNumber()
    @Min(0)
    actualCash!: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class CheckoutItemDto {
    @IsString()
    name!: string;

    @IsNumber()
    @Min(1)
    qty!: number;

    @IsNumber()
    @Min(0)
    unitPrice!: number;

    @IsNumber()
    @Min(0)
    discount!: number;

    @IsNumber()
    @Min(0)
    totalPrice!: number;

    @IsOptional()
    @IsString()
    productId?: string;

    @IsOptional()
    @IsString()
    serviceId?: string;

    @IsOptional()
    @IsString()
    note?: string;
}

export class CheckoutDto {
    @IsString()
    businessId!: string;

    @IsString()
    staffId!: string; // The cashier BusinessMember ID

    @IsOptional()
    @IsString()
    clientId?: string;

    @IsOptional()
    @IsString()
    shiftId?: string; // Must be provided if business uses CASH_SHIFTS

    @IsNumber()
    @Min(0)
    subtotal!: number;

    @IsNumber()
    @Min(0)
    discount!: number;

    @IsNumber()
    @Min(0)
    total!: number;

    @IsEnum(PaymentMethod)
    paymentMethod!: PaymentMethod;

    @IsOptional()
    @IsNumber()
    cashGiven?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CheckoutItemDto)
    items!: CheckoutItemDto[];

    @IsOptional()
    metadata?: any;
}
