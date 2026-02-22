import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';

export class IssueGiftCardDto {
    @IsUUID()
    @IsNotEmpty()
    businessId!: string;

    @IsNumber()
    @Min(1)
    initialBalance!: number;

    @IsUUID()
    @IsOptional()
    purchaserId?: string; // App Client who bought it

    @IsString()
    @IsOptional()
    recipientName?: string; // Who it goes to (optional tracking)

    @IsNumber()
    @IsOptional()
    expiresInDays?: number; // E.g. 365
}

export class RedeemGiftCardDto {
    @IsString()
    @IsNotEmpty()
    code!: string; // The physical or virtual code "AETERNA-XXXX-XXXX"

    @IsNumber()
    @Min(0.01)
    amountToDeduct!: number;

    @IsUUID()
    @IsNotEmpty()
    businessId!: string; // Ensure the card belongs to the business trying to deduct it
}
