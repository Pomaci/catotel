import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  IsInt,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReservationStatus } from '@prisma/client';
import { ReservationAddonDto } from './create-reservation.dto';

export class UpdateReservationDto {
  @IsOptional()
  @IsString()
  @Matches(/^c[a-z0-9]{24}$/i, { message: 'roomId must be a valid cuid' })
  roomId?: string;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Matches(/^c[a-z0-9]{24}$/i, {
    each: true,
    message: 'each value in catIds must be a valid cuid',
  })
  catIds?: string[];

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationAddonDto)
  addons?: ReservationAddonDto[];

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;
}
