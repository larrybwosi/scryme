import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class AttachLpoDto {
  @ApiProperty({ example: 'LPO-2023-001' })
  @IsString()
  @IsNotEmpty()
  lpoNumber: string;

  @ApiProperty({ example: '2023-10-01T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  lpoDate?: string;

  @ApiProperty({ example: '2023-12-31T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  lpoExpiryDate?: string;

  @ApiProperty({ example: 'https://storage.example.com/lpos/lpo-001.pdf', required: false })
  @IsString()
  @IsOptional()
  lpoUrl?: string;
}
