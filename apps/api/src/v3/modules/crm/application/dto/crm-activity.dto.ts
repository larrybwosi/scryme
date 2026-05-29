import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsJSON } from 'class-validator';

export class CreateCrmActivityDto {
  @ApiProperty({ example: 'rec_123' })
  @IsString()
  @IsNotEmpty()
  recordId: string;

  @ApiProperty({ example: 'CALL' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'Initial introductory call with the client.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: { duration: '15m', outcome: 'interested' } })
  @IsJSON()
  @IsOptional()
  metadata?: any;
}
