import { ApiProperty } from '@nestjs/swagger';

export class CustomerSearchDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name?: string | null;

  @ApiProperty()
  phone?: string | null;
}
