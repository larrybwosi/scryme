import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsUrl,
  IsOptional,
  IsBoolean,
  IsObject,
} from "class-validator";

export class CreateWebhookDto {
  @ApiProperty({ example: "Inventory Sync" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "https://example.com/webhooks/dealio" })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ example: ["inventory.updated", "order.created"] })
  @IsArray()
  @IsString({ each: true })
  events: string[];
}

export class UpdateWebhookDto {
  @ApiPropertyOptional({ example: "Updated Inventory Sync" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "https://example.com/webhooks/v2" })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiPropertyOptional({ example: ["inventory.updated", "order.created"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateIncomingWebhookDto {
  @ApiProperty({ example: "Stripe Payment Callbacks" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: "whsec_incoming_12345" })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiPropertyOptional({ example: { "X-Custom-Header": "value" } })
  @IsOptional()
  @IsObject()
  headers?: Record<string, any>;

  @ApiPropertyOptional({ example: "definition_cuid_123" })
  @IsOptional()
  @IsString()
  definitionId?: string;
}

export class TestWebhookDto {
  @ApiPropertyOptional({ example: "test.event" })
  @IsOptional()
  @IsString()
  event?: string;

  @ApiPropertyOptional({ example: { test: true, timestamp: "2026-03-31T00:00:00.000Z" } })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}

export class WebhookResponseDto {
  @ApiProperty({ example: "wh_123" })
  id: string;

  @ApiProperty({ example: "Inventory Sync" })
  name: string;

  @ApiProperty({ example: "https://example.com/webhooks/dealio" })
  url: string;

  @ApiProperty({ example: ["inventory.updated", "order.created"] })
  events: string[];

  @ApiProperty({ example: "whsec_abc123" })
  secret: string;

  @ApiProperty({ example: true })
  isActive: boolean;
}
