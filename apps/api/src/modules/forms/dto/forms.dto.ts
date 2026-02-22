import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, ValidateNested, IsUUID, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export enum FormFieldType {
    TEXT = 'text',
    EMAIL = 'email',
    PHONE = 'phone',
    TEXTAREA = 'textarea',
    SELECT = 'select',
    CHECKBOX = 'checkbox',
    DATE = 'date',
    NUMBER = 'number',
    SIGNATURE = 'signature',
    RATING = 'rating'
}

export class FormFieldDto {
    @IsString()
    @IsNotEmpty()
    id!: string;

    @IsString()
    @IsNotEmpty()
    label!: string;

    @IsEnum(FormFieldType)
    type!: FormFieldType;

    @IsBoolean()
    required!: boolean;

    @IsOptional()
    @IsString()
    options?: string;
}

export class CreateFormTemplateDto {
    @IsUUID()
    businessId!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FormFieldDto)
    fields!: FormFieldDto[];
}

export class UpdateFormTemplateDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FormFieldDto)
    fields?: FormFieldDto[];
}

export class SubmitFormResponseDto {
    @IsUUID()
    businessId!: string;

    @IsOptional()
    @IsUUID()
    clientId?: string;

    @IsObject()
    @IsNotEmpty()
    responseData!: Record<string, any>;
}
