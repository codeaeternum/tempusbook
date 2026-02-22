import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAlbumDto {
    @IsUUID()
    @IsNotEmpty()
    businessId!: string;

    @IsUUID()
    @IsNotEmpty()
    clientId!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class AddImageDto {
    @IsUUID()
    @IsNotEmpty()
    albumId!: string;

    @IsString()
    @IsNotEmpty()
    url!: string;

    @IsString()
    @IsOptional()
    thumbnailUrl?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class CreateAnnotationDto {
    @IsNumber()
    x!: number; // 0 to 1 relative X coordinate

    @IsNumber()
    y!: number; // 0 to 1 relative Y coordinate

    @IsString()
    @IsNotEmpty()
    note!: string;

    @IsString()
    @IsOptional()
    color?: string;
}

export class AddAnnotationsDto {
    @IsUUID()
    @IsNotEmpty()
    imageId!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAnnotationDto)
    annotations!: CreateAnnotationDto[];
}
