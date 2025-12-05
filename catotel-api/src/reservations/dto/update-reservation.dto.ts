import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  IsInt,
  IsBoolean,
  IsNumber,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReservationStatus } from '@prisma/client';
import { ReservationAddonDto } from './create-reservation.dto';

class CheckItemDto {
  @IsString()
  label!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

class FeedingPlanDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  amountPerMeal?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  frequencyPerDay?: number;

  @IsOptional()
  @IsString()
  instructions?: string;
}

class MedicationPlanDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsBoolean()
  withFood?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

class CheckInFormDto {
  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckItemDto)
  deliveredItems?: CheckItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FeedingPlanDto)
  foodPlan?: FeedingPlanDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationPlanDto)
  medicationPlan?: MedicationPlanDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'weightKg must be a number' })
  weightKg?: number;

  @IsOptional()
  @IsString()
  catCondition?: string;

  @IsOptional()
  @IsBoolean()
  hasVaccineCard?: boolean;

  @IsOptional()
  @IsBoolean()
  hasFleaTreatment?: boolean;

  @IsOptional()
  @IsString()
  handledBy?: string;

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

class CheckOutFormDto {
  @IsOptional()
  @IsDateString()
  departureTime?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckItemDto)
  returnedItems?: CheckItemDto[];

  @IsOptional()
  @IsString()
  catCondition?: string;

  @IsOptional()
  @IsString()
  incidents?: string;

  @IsOptional()
  @IsString()
  roomConditionNote?: string;

  @IsOptional()
  @IsString()
  remainingFood?: string;

  @IsOptional()
  @IsString()
  nextVisitNote?: string;

  @IsOptional()
  @IsString()
  handledBy?: string;

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

export class UpdateReservationDto {
  @IsOptional()
  @IsString()
  @Matches(/^c[a-z0-9]{24}$/i, { message: 'roomTypeId must be a valid cuid' })
  roomTypeId?: string;

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

  @IsOptional()
  @ValidateNested()
  @Type(() => CheckInFormDto)
  checkInForm?: CheckInFormDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CheckOutFormDto)
  checkOutForm?: CheckOutFormDto;

  @IsOptional()
  @IsBoolean()
  allowRoomSharing?: boolean;
}
