import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class MultiCatDiscountTierDto {
  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  catCount!: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent!: number;
}

export class SharedRoomDiscountTierDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  remainingCapacity!: number;

  @ApiProperty({ example: 8 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent!: number;
}

export class LongStayDiscountTierDto {
  @ApiProperty({ example: 7 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minNights!: number;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent!: number;
}

export class LegacyLongStayDiscountDto {
  @ApiProperty({ example: true })
  @Type(() => Boolean)
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minNights!: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent!: number;
}

export class PricingSettingsResponseDto {
  @ApiPropertyOptional({ type: Boolean })
  multiCatDiscountEnabled?: boolean;

  @ApiPropertyOptional({
    type: [MultiCatDiscountTierDto],
  })
  multiCatDiscounts?: MultiCatDiscountTierDto[];

  @ApiPropertyOptional({ type: Boolean })
  sharedRoomDiscountEnabled?: boolean;

  @ApiPropertyOptional({ type: Number, example: 5 })
  sharedRoomDiscountPercent?: number | null;

  @ApiPropertyOptional({
    type: [SharedRoomDiscountTierDto],
  })
  sharedRoomDiscounts?: SharedRoomDiscountTierDto[];

  @ApiPropertyOptional({ type: Boolean })
  longStayDiscountEnabled?: boolean;

  @ApiPropertyOptional({
    type: [LongStayDiscountTierDto],
  })
  longStayDiscounts?: LongStayDiscountTierDto[];

  @ApiPropertyOptional({ type: LegacyLongStayDiscountDto })
  longStayDiscount?: LegacyLongStayDiscountDto | null;
}

export class UpdatePricingSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  multiCatDiscountEnabled?: boolean;

  @ApiPropertyOptional({ type: [MultiCatDiscountTierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultiCatDiscountTierDto)
  multiCatDiscounts?: MultiCatDiscountTierDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  sharedRoomDiscountEnabled?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  sharedRoomDiscountPercent?: number | null;

  @ApiPropertyOptional({ type: [SharedRoomDiscountTierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SharedRoomDiscountTierDto)
  sharedRoomDiscounts?: SharedRoomDiscountTierDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  longStayDiscountEnabled?: boolean;

  @ApiPropertyOptional({ type: [LongStayDiscountTierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LongStayDiscountTierDto)
  longStayDiscounts?: LongStayDiscountTierDto[];

  @ApiPropertyOptional({ type: LegacyLongStayDiscountDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LegacyLongStayDiscountDto)
  longStayDiscount?: LegacyLongStayDiscountDto | null;
}
