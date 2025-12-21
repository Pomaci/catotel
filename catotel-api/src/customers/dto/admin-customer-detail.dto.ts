import { ApiProperty } from '@nestjs/swagger';

export class AdminCustomerCatDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  breed!: string | null;

  @ApiProperty({ nullable: true })
  gender!: string | null;

  @ApiProperty({ nullable: true })
  birthDate!: string | null;

  @ApiProperty({ nullable: true })
  weightKg!: number | string | null;

  @ApiProperty({ nullable: true })
  isNeutered!: boolean | null;

  @ApiProperty({ nullable: true })
  photoUrl!: string | null;

  @ApiProperty({ nullable: true })
  medicalNotes!: string | null;

  @ApiProperty({ nullable: true })
  dietaryNotes!: string | null;

  @ApiProperty({ nullable: true })
  createdAt!: string | null;
}

export class AdminCustomerReservationCatDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  photoUrl!: string | null;
}

export class AdminCustomerReservationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  checkIn!: string;

  @ApiProperty()
  checkOut!: string;

  @ApiProperty()
  totalPrice!: number | string;

  @ApiProperty({ nullable: true })
  roomType!: { id: string; name: string } | null;

  @ApiProperty({ type: [AdminCustomerReservationCatDto] })
  cats!: AdminCustomerReservationCatDto[];
}

export class AdminCustomerDetailDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ nullable: true })
  name!: string | null;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty({ nullable: true })
  address!: string | null;

  @ApiProperty({ nullable: true })
  preferredVet!: string | null;

  @ApiProperty({ nullable: true })
  emergencyContactName!: string | null;

  @ApiProperty({ nullable: true })
  emergencyContactPhone!: string | null;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty({ type: [AdminCustomerCatDto] })
  cats!: AdminCustomerCatDto[];

  @ApiProperty({ type: [AdminCustomerReservationDto] })
  reservations!: AdminCustomerReservationDto[];
}
