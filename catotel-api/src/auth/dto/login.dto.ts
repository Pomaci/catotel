import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email used as the login identifier',
    example: 'catlover@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Plaintext password (min 8 characters)',
    example: 'S3cureP@ssw0rd',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
