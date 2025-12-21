import { ApiProperty } from '@nestjs/swagger';

export class AdminCustomerListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string | null;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty()
  catCount!: number;

  @ApiProperty()
  reservationCount!: number;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'] })
  status!: 'ACTIVE' | 'INACTIVE';

  @ApiProperty()
  joinedAt!: Date;

  @ApiProperty({ nullable: true })
  lastReservationAt!: Date | null;
}

export class AdminCustomerListResponseDto {
  @ApiProperty({ type: [AdminCustomerListItemDto] })
  items!: AdminCustomerListItemDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
