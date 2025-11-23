import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    description: 'Browser or device user agent',
    example: 'Mozilla/5.0',
  })
  userAgent!: string;

  @ApiProperty({ description: 'Reported IP address', example: '127.0.0.1' })
  ip!: string;

  @ApiProperty({ default: false })
  isRevoked!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  lastUsedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;
}
