import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min, IsUUID } from 'class-validator';

export class CreatePackageDto {
    @IsUUID()
    @IsNotEmpty()
    businessId!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(0)
    price!: number;

    @IsNumber()
    @Min(1)
    sessions!: number;

    @IsNumber()
    @IsOptional()
    expiresIn?: number;

    @IsUUID()
    @IsOptional()
    serviceId?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class AssignPackageToClientDto {
    @IsUUID()
    @IsNotEmpty()
    businessId!: string;

    @IsString() // Can be Firebase UID or UUID
    @IsNotEmpty()
    clientId!: string;

    @IsUUID()
    @IsNotEmpty()
    packageId!: string;
}

export class DeductSessionDto {
    @IsString()
    @IsOptional()
    notes?: string;

    @IsUUID()
    @IsOptional()
    bookingId?: string;
}
