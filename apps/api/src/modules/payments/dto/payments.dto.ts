import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { PaymentMethod, PaymentType, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
    @IsString()
    @IsOptional()
    bookingId?: string;

    @IsString()
    @IsOptional()
    saleId?: string;

    @IsNumber()
    @Min(0)
    amount!: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsEnum(PaymentType)
    @IsOptional()
    type?: PaymentType;

    @IsEnum(PaymentStatus)
    @IsOptional()
    status?: PaymentStatus;

    @IsEnum(PaymentMethod)
    method!: PaymentMethod;

    @IsString()
    @IsOptional()
    mpPaymentId?: string;

    @IsString()
    @IsOptional()
    mpPreferenceId?: string;

    @IsOptional()
    mpResponse?: any;
}

export class UpdatePaymentDto {
    @IsEnum(PaymentStatus)
    status!: PaymentStatus;
}
