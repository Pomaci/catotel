import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CustomerSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiPropertyOptional()
  address?: string | null;
}

export class StaffSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional()
  position?: string | null;

  @ApiPropertyOptional()
  phone?: string | null;
}

export class UserProfileDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'newcat@catotel.com' })
  email!: string;

  @ApiProperty({ example: 'Luna', nullable: true, required: false })
  name?: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  role!: UserRole;

  @ApiPropertyOptional({ type: CustomerSummaryDto })
  customer?: CustomerSummaryDto | null;

  @ApiPropertyOptional({ type: StaffSummaryDto })
  staff?: StaffSummaryDto | null;
}
