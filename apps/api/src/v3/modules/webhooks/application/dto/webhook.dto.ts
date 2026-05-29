import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsUrl } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ example: 'Inventory Sync' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'https://example.com/webhooks/dealio' })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ example: ['inventory.updated', 'order.created'] })
  @IsArray()
  @IsString({ each: true })
  events: string[];
}

export class WebhookResponseDto {
  @ApiProperty({ example: 'wh_123' })
  id: string;

  @ApiProperty({ example: 'Inventory Sync' })
  name: string;

  @ApiProperty({ example: 'https://example.com/webhooks/dealio' })
  url: string;

  @ApiProperty({ example: ['inventory.updated', 'order.created'] })
  events: string[];

  @ApiProperty({ example: 'whsec_abc123' })
  secret: string;
}
