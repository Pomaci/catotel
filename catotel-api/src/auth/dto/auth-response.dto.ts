import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class AuthUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'catlover@example.com' })
  email!: string;

  @ApiProperty({ example: 'Mila the Cat', nullable: true, required: false })
  name?: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  role!: UserRole;
}

export class AuthTokensDto {
  @ApiProperty({
    description: 'Short-lived access token (JWT)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token!: string;

  @ApiProperty({
    description: 'Refresh token that rotates on each refresh call',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token!: string;
}

export class AuthResponseDto extends AuthTokensDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
