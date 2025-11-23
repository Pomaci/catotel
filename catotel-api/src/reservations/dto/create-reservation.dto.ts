import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReservationAddonDto {
  @IsUUID()
  serviceId!: string;

  @IsInt()
  @Min(1)
  quantity: number = 1;
}

export class CreateReservationDto {
  @IsUUID()
  roomId!: string;

  @IsDateString()
  checkIn!: string;

  @IsDateString()
  checkOut!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  catIds!: string[];

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationAddonDto)
  addons?: ReservationAddonDto[];
}
