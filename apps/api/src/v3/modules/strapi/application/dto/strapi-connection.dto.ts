import {
  IsString,
  IsUrl,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  IsNotEmpty,
  IsEnum,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { SyncDirection, EntitySyncType } from "@repo/db";

// ─────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────

export class CreateStrapiConnectionDto {
  @ApiProperty({ description: "Friendly display name, e.g. 'Main Storefront'" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "Strapi v4 base URL, e.g. https://cms.example.com" })
  @IsUrl({ require_tld: false }) // allow localhost in dev
  strapiUrl: string;

  @ApiProperty({ description: "Full-access API token from Strapi admin → API Tokens" })
  @IsString()
  @MinLength(10)
  apiToken: string;

  @ApiPropertyOptional({ description: "Read-only public token for storefront queries" })
  @IsOptional()
  @IsString()
  publicToken?: string;

  @ApiPropertyOptional({ description: "HMAC secret used to verify Strapi webhook signatures" })
  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @ApiPropertyOptional({ default: "/graphql" })
  @IsOptional()
  @IsString()
  graphqlPath?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  webhooksEnabled?: boolean;

  @ApiPropertyOptional({ description: "Strapi content-type UIDs to sync", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contentTypes?: string[];

  @ApiPropertyOptional({
    description: 'Map storefront slugs to Scryme InventoryLocation IDs, e.g. { "store-lagos": "loc_abc" }',
  })
  @IsOptional()
  @IsObject()
  locationMap?: Record<string, string>;

  @ApiPropertyOptional({ enum: SyncDirection, default: SyncDirection.BIDIRECTIONAL })
  @IsOptional()
  @IsEnum(SyncDirection)
  syncDirection?: SyncDirection;

  @ApiPropertyOptional({ enum: EntitySyncType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(EntitySyncType, { each: true })
  enabledSyncTypes?: EntitySyncType[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoSync?: boolean;

  @ApiPropertyOptional({ description: "Auto sync interval in minutes" })
  @IsOptional()
  syncInterval?: number;

  @ApiPropertyOptional({ description: "Default InventoryLocation ID for product sync" })
  @IsOptional()
  @IsString()
  defaultLocationId?: string;
}

// ─────────────────────────────────────────────
// Update (all fields optional)
// ─────────────────────────────────────────────

export class UpdateStrapiConnectionDto extends PartialType(CreateStrapiConnectionDto) {}

// ─────────────────────────────────────────────
// Response
// ─────────────────────────────────────────────

export class StrapiConnectionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() strapiUrl: string;
  @ApiProperty() syncDirection: string;
  @ApiProperty() enabledSyncTypes: string[];
  @ApiProperty() webhooksEnabled: boolean;
  @ApiProperty() contentTypes: string[];
  @ApiPropertyOptional() locationMap?: Record<string, string>;
  @ApiProperty() autoSync: boolean;
  @ApiPropertyOptional() syncInterval?: number;
  @ApiPropertyOptional() defaultLocationId?: string;
  @ApiPropertyOptional() strapiVersion?: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional() lastSyncAt?: Date;
}

// ─────────────────────────────────────────────
// Manual sync trigger
// ─────────────────────────────────────────────

export class TriggerSyncDto {
  @ApiProperty({ enum: EntitySyncType, isArray: true })
  @IsArray()
  @IsEnum(EntitySyncType, { each: true })
  syncTypes: EntitySyncType[];

  @ApiPropertyOptional({ enum: SyncDirection })
  @IsOptional()
  @IsEnum(SyncDirection)
  direction?: SyncDirection;
}
