import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class TokenRequestDto {
  @ApiProperty({
    example: "client_id_123",
    description: "The Client ID provided during provisioning or registration",
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    example: "client_secret_456",
    description: "The Client Secret (optional for client devices like POS/Bakery)",
    required: false,
  })
  @IsString()
  @IsOptional()
  clientSecret?: string;
}

export class TokenResponseDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  access_token: string;

  @ApiProperty({ example: "Bearer" })
  token_type: string;

  @ApiProperty({ example: 3600 })
  expires_in: number;
}
