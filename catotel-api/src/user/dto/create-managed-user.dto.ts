import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateManagedUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] })
  @IsEnum(UserRole, {
    message: 'Role must be ADMIN, MANAGER, or STAFF',
  })
  role!: UserRole;
}
