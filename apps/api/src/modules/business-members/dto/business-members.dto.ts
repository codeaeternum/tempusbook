import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export enum BusinessRole {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    EMPLOYEE = 'EMPLOYEE'
}

export class CreateBusinessMemberDto {
    @IsUUID()
    @IsNotEmpty()
    businessId!: string;

    @IsUUID()
    @IsOptional()
    userId?: string;

    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsOptional()
    specialties?: string[];

    @IsEnum(BusinessRole)
    @IsOptional()
    role?: BusinessRole;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsString()
    @IsOptional()
    color?: string;
}

export class UpdateBusinessMemberDto {
    @IsEnum(BusinessRole)
    @IsOptional()
    role?: BusinessRole;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsString()
    @IsOptional()
    color?: string;
}
