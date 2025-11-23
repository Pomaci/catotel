import { ApiProperty } from '@nestjs/swagger';
import { CareTaskStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: CareTaskStatus })
  @IsEnum(CareTaskStatus)
  status!: CareTaskStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
