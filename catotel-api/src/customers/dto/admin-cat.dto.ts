import { ApiProperty } from '@nestjs/swagger';
import { CatGender } from '@prisma/client';

class AdminCatOwnerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false, nullable: true })
  name?: string | null;

  @ApiProperty()
  email!: string;

  @ApiProperty({ required: false, nullable: true })
  phone?: string | null;
}

export class AdminCatListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false, nullable: true })
  breed?: string | null;

  @ApiProperty({ enum: CatGender, required: false, nullable: true })
  gender?: CatGender | null;

  @ApiProperty({ required: false, nullable: true })
  birthDate?: string | null;

  @ApiProperty()
  isNeutered!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ type: AdminCatOwnerDto })
  owner!: AdminCatOwnerDto;
}

export class AdminCatListResponseDto {
  @ApiProperty({ type: [AdminCatListItemDto] })
  items!: AdminCatListItemDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}

export class AdminCatDetailDto extends AdminCatListItemDto {
  @ApiProperty({ required: false, nullable: true })
  dietaryNotes?: string | null;

  @ApiProperty({ required: false, nullable: true })
  medicalNotes?: string | null;

  @ApiProperty({ required: false, nullable: true })
  weightKg?: string | number | null;

  @ApiProperty({ required: false, nullable: true })
  photoUrl?: string | null;
}
