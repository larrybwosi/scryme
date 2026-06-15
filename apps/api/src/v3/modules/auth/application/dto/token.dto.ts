import {ApiProperty} from "@nestjs/swagger";
import {IsString, IsNotEmpty} from "class-validator";

export class TokenRequestDto {
  @ApiProperty({
    example: "client_id_123",
    description: "The Client ID provided during provisioning or registration",
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({example: "client_secret_456", description: "The Client Secret"})
  @IsString()
  @IsNotEmpty()
  clientSecret: string;
}

export class TokenResponseDto {
  @ApiProperty({example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."})
  accessToken: string;

  @ApiProperty({example: "Bearer"})
  tokenType: string;

  @ApiProperty({example: 3600})
  expiresIn: number;
}
