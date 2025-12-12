import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRoomTypeDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({ default: 1 })
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiProperty({ description: 'Nightly rate for this room type' })
  @IsNumber()
  nightlyRate!: number;

  @ApiPropertyOptional({
    description:
      'Optional overbooking allowance (number of extra rooms allowed to be sold)',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  overbookingLimit?: number;

  @ApiPropertyOptional({ description: 'JSON string of amenities' })
  @IsOptional()
  amenities?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
