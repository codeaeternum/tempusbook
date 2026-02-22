import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDraftSaleFromBookingDto {
    @IsString()
    @IsNotEmpty()
    bookingId!: string;

    @IsString()
    @IsNotEmpty()
    businessId!: string;

    @IsString()
    @IsNotEmpty()
    staffId!: string; // Current cashier or employee fulfilling the order

    @IsString()
    @IsOptional()
    shiftId?: string; // Necessary if the business has CASH_SHIFTS enabled
}
