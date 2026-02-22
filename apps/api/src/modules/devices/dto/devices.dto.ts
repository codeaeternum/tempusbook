import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { DeviceType } from '@prisma/client';

export class CreateDeviceDto {
    @IsNotEmpty()
    @IsString()
    businessId!: string;

    @IsNotEmpty()
    @IsString()
    clientId!: string;

    @IsEnum(DeviceType)
    @IsOptional()
    deviceType?: DeviceType;

    @IsNotEmpty()
    @IsString()
    brand!: string;

    @IsNotEmpty()
    @IsString()
    model!: string;

    @IsOptional()
    @IsString()
    serialNumber?: string;

    @IsOptional()
    @IsString()
    imei?: string;

    @IsOptional()
    @IsString()
    passwordPin?: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateDeviceDto {
    @IsOptional()
    @IsString()
    brand?: string;

    @IsOptional()
    @IsString()
    model?: string;

    @IsEnum(DeviceType)
    @IsOptional()
    deviceType?: DeviceType;

    @IsOptional()
    @IsString()
    serialNumber?: string;

    @IsOptional()
    @IsString()
    imei?: string;

    @IsOptional()
    @IsString()
    passwordPin?: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
