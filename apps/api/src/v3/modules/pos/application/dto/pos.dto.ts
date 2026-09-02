import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class ProvisionDeviceDto {
  @ApiProperty({
    example: "setup_123",
    description: "The setup token generated in the dashboard",
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class PosLoginDto {
  @ApiPropertyOptional({
    example: "device_123",
    description: "The Client ID of the provisioned device",
  })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({
    example: "device_key_123",
    description: "The device key of the provisioned device (alias for clientId)",
  })
  @IsString()
  @IsOptional()
  deviceKey?: string;

  @ApiPropertyOptional({
    example: "loc_123",
    description: "Optional location ID context",
  })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({ example: "1234", description: "The staff PIN" })
  @IsString()
  @IsOptional()
  pin?: string;

  @ApiPropertyOptional({
    example: "CARD-123",
    description: "Optional card ID for optimized member lookup",
  })
  @IsString()
  @IsOptional()
  cardId?: string;
}

export class PosLoginResponseDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  accessToken: string;
}

export class ProvisionResponseDto {
  @ApiProperty({ example: "client_id_123" })
  clientId: string;

  @ApiProperty({ example: "client_secret_456" })
  clientSecret: string;
}
