import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateOAuthClientDto {
  @ApiProperty({ description: "Name of the OAuth Application", example: "My Custom App" })
  name!: string;

  @ApiProperty({
    description: "Allowed redirect URIs for authorization callback",
    example: ["https://myapp.com/api/auth/callback"],
    type: [String],
  })
  redirectUris!: string[];

  @ApiPropertyOptional({ description: "URL to application icon/logo", example: "https://myapp.com/logo.png" })
  icon?: string;

  @ApiPropertyOptional({ description: "URL to application homepage", example: "https://myapp.com" })
  uri?: string;

  @ApiPropertyOptional({ description: "URL to Terms of Service", example: "https://myapp.com/tos" })
  tos?: string;

  @ApiPropertyOptional({ description: "URL to Privacy Policy", example: "https://myapp.com/privacy" })
  policy?: string;

  @ApiPropertyOptional({ description: "Whether this client is public (PKCE only, no client_secret)", example: false })
  public?: boolean;

  @ApiPropertyOptional({ description: "Whether to skip user consent screen", example: false })
  skipConsent?: boolean;
}

export class UpdateOAuthClientDto {
  @ApiPropertyOptional({ description: "Name of the OAuth Application", example: "My Custom App" })
  name?: string;

  @ApiPropertyOptional({
    description: "Allowed redirect URIs for authorization callback",
    example: ["https://myapp.com/api/auth/callback"],
    type: [String],
  })
  redirectUris?: string[];

  @ApiPropertyOptional({ description: "URL to application icon/logo", example: "https://myapp.com/logo.png" })
  icon?: string;

  @ApiPropertyOptional({ description: "URL to application homepage", example: "https://myapp.com" })
  uri?: string;

  @ApiPropertyOptional({ description: "URL to Terms of Service", example: "https://myapp.com/tos" })
  tos?: string;

  @ApiPropertyOptional({ description: "URL to Privacy Policy", example: "https://myapp.com/privacy" })
  policy?: string;

  @ApiPropertyOptional({ description: "Whether this client is public (PKCE only, no client_secret)", example: false })
  public?: boolean;

  @ApiPropertyOptional({ description: "Whether to skip user consent screen", example: false })
  skipConsent?: boolean;
}

export class OAuthClientResponseDto {
  @ApiProperty({ description: "Internal ID", example: "clx123456789" })
  id!: string;

  @ApiProperty({ description: "Public OAuth Client ID", example: "client_abc123" })
  clientId!: string;

  @ApiPropertyOptional({ description: "OAuth Client Secret (returned on creation)", example: "secret_xyz789" })
  clientSecret?: string;

  @ApiProperty({ description: "Name of the application", example: "My Custom App" })
  name!: string;

  @ApiPropertyOptional({ description: "Icon URL" })
  icon?: string;

  @ApiPropertyOptional({ description: "Homepage URI" })
  uri?: string;

  @ApiProperty({ description: "Redirect URIs", type: [String] })
  redirectUris!: string[];

  @ApiPropertyOptional({ description: "Public client flag" })
  public?: boolean;

  @ApiPropertyOptional({ description: "Skip consent flag" })
  skipConsent?: boolean;

  @ApiProperty({ description: "Creation date" })
  createdAt!: Date;

  @ApiProperty({ description: "Last update date" })
  updatedAt!: Date;
}
