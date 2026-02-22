import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';

export class CreateCheckoutDto {
    @IsString()
    @IsNotEmpty()
    businessId!: string;

    @IsEnum(SubscriptionPlan)
    @IsNotEmpty()
    plan!: SubscriptionPlan; // e.g., 'STARTER', 'PRO', 'BUSINESS'
}
