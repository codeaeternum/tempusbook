import { IsString, IsInt, IsOptional, IsUUID } from 'class-validator';

export class CreateVehicleDto {
    @IsUUID()
    businessId!: string;

    @IsUUID()
    clientId!: string;

    @IsString()
    @IsOptional()
    vin?: string;

    @IsString()
    make!: string;

    @IsString()
    model!: string;

    @IsInt()
    @IsOptional()
    year?: number;

    @IsString()
    @IsOptional()
    licensePlate?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateVehicleDto {
    @IsString()
    @IsOptional()
    vin?: string;

    @IsString()
    @IsOptional()
    make?: string;

    @IsString()
    @IsOptional()
    model?: string;

    @IsInt()
    @IsOptional()
    year?: number;

    @IsString()
    @IsOptional()
    licensePlate?: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
