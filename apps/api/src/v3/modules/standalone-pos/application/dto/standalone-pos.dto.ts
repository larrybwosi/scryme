import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateSetupKeyDto {
  @ApiProperty({ description: 'Human-readable name for the device' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Human-assigned ID for the device (e.g., POS-001)' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiPropertyOptional({ description: 'Expiry in days', default: 7 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  expiresInDays?: number = 7;
}

export class ActivateDeviceDto {
  @ApiProperty({ description: 'The secure setup token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Unique hardware machine ID' })
  @IsString()
  @IsNotEmpty()
  machineId: string;

  @ApiPropertyOptional({ description: 'Device hardware fingerprint' })
  @IsString()
  @IsOptional()
  fingerprint?: string;

  @ApiPropertyOptional({ description: 'Device serial number' })
  @IsString()
  @IsOptional()
  serialNumber?: string;
}

export class LinkOrganizationDto {
  @ApiProperty({ description: 'The internal ID of the standalone device' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ description: 'The ID of the organization to link to' })
  @IsString()
  @IsNotEmpty()
  organizationId: string;
}
