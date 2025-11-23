import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRoomDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ default: 1 })
  @IsNumber()
  capacity!: number;

  @ApiProperty({ description: 'Nightly rate in USD' })
  @IsNumber()
  nightlyRate!: number;

  @ApiPropertyOptional({ description: 'JSON string of amenities' })
  @IsOptional()
  amenities?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
