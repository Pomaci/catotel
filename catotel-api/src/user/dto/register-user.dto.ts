import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ example: 'newcat@catotel.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'Purrfect123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    example: 'Luna',
    nullable: true,
    required: false,
    description: 'Optional display name to show in dashboards',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
