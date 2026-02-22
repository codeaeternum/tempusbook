import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEmail } from 'class-validator';

export class CreatePublicBookingDto {
    @IsString()
    @IsNotEmpty()
    serviceId!: string;

    @IsString()
    @IsOptional()
    staffId?: string;

    @IsDateString()
    @IsNotEmpty()
    startTime!: string;

    @IsString()
    @IsNotEmpty()
    clientName!: string;

    @IsString()
    @IsNotEmpty()
    clientPhone!: string;

    @IsEmail()
    @IsNotEmpty()
    clientEmail!: string;
}
