import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export enum GalleryType {
    BEFORE_AFTER = 'BEFORE_AFTER',
    PORTFOLIO = 'PORTFOLIO',
    DOCUMENT = 'DOCUMENT'
}

export class CreateGalleryItemDto {
    @IsUUID()
    @IsNotEmpty()
    businessId!: string;

    @IsEnum(GalleryType)
    @IsNotEmpty()
    type!: GalleryType;

    @IsString()
    @IsOptional()
    title?: string;

    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
}
