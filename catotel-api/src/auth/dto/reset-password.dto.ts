import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Raw token from the reset email' })
  @IsString()
  token!: string;

  @ApiProperty({ minLength: 8, description: 'New password' })
  @IsString()
  @MinLength(8)
  password!: string;
}
