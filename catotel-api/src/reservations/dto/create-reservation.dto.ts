import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
  IsInt,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReservationAddonDto {
  @IsString()
  @Matches(/^c[a-z0-9]{24}$/i, { message: 'serviceId must be a valid cuid' })
  serviceId!: string;

  @IsInt()
  @Min(1)
  quantity: number = 1;
}

export class CreateReservationDto {
  @IsString()
  @Matches(/^c[a-z0-9]{24}$/i, {
    message: 'roomTypeId must be a valid cuid',
  })
  roomTypeId!: string;

  @IsDateString()
  checkIn!: string;

  @IsDateString()
  checkOut!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Matches(/^c[a-z0-9]{24}$/i, {
    each: true,
    message: 'each value in catIds must be a valid cuid',
  })
  catIds!: string[];

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationAddonDto)
  addons?: ReservationAddonDto[];

  @IsOptional()
  @IsString()
  @Matches(/^c[a-z0-9]{24}$/i, { message: 'customerId must be a valid cuid' })
  customerId?: string;

  @IsOptional()
  allowRoomSharing?: boolean;
}
