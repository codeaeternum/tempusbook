import { IsString, IsInt, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { WorkOrderStatus } from '@prisma/client';

export class CreateWorkOrderDto {
    @IsUUID()
    businessId!: string;

    @IsUUID()
    clientId!: string;

    @IsUUID()
    @IsOptional()
    vehicleId?: string;

    @IsOptional()
    @IsString()
    deviceId?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @IsOptional()
    odometer?: number;
}

export class UpdateWorkOrderDto {
    @IsEnum(WorkOrderStatus)
    @IsOptional()
    status?: WorkOrderStatus;

    @IsString()
    @IsOptional()
    description?: string;

    @IsInt()
    @IsOptional()
    odometer?: number;
}
