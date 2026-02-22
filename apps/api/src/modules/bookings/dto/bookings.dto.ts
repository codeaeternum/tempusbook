import {
    IsString,
    IsUUID,
    IsOptional,
    IsDateString,
    IsEnum,
    IsObject,
} from 'class-validator';

export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW',
}

export class CreateBookingDto {
    @IsUUID()
    businessId!: string;

    @IsUUID()
    @IsOptional()
    clientId?: string;

    @IsUUID()
    serviceId!: string;

    @IsUUID()
    @IsOptional()
    staffId?: string;

    @IsUUID()
    @IsOptional()
    branchId?: string;

    @IsDateString()
    startTime!: string;

    @IsString()
    @IsOptional()
    clientNotes?: string;

    @IsObject()
    @IsOptional()
    intakeFormData?: Record<string, any>;
}

export class UpdateBookingStatusDto {
    @IsEnum(BookingStatus)
    status!: BookingStatus;

    @IsString()
    @IsOptional()
    reason?: string;
}

export class RescheduleBookingDto {
    @IsDateString()
    startTime!: string;
}

export class JoinWaitlistDto {
    @IsUUID()
    businessId!: string;

    @IsUUID()
    @IsOptional()
    clientId?: string;

    @IsUUID()
    serviceId!: string;

    @IsDateString()
    @IsOptional()
    preferredDate?: string;
}
