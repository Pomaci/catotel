import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class AddonServiceDto {
  @ApiProperty({ example: 'c123abc456def789ghi012jk' })
  id!: string;

  @ApiProperty({ example: 'Grooming' })
  name!: string;

  @ApiPropertyOptional({ example: 'Ekstra tüy bakımı' })
  description?: string | null;

  @ApiProperty({ example: 150 })
  price!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2025-12-07T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-12-07T10:00:00.000Z' })
  updatedAt!: Date;
}

export class CreateAddonServiceDto {
  @ApiProperty({ example: 'Ekstra oyun seansı' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: '30 dakikalık oyun' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @ApiProperty({ example: 150 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAddonServiceDto {
  @ApiPropertyOptional({ example: 'Ekstra oyun seansı' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '30 dakikalık oyun' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string | null;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
