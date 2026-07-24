import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsArray,
  IsEnum,
} from "class-validator";
import { IntegrationCategory, AuthType } from "@repo/db";

export class CreateOrganizationDto {
  @ApiProperty({ description: "The name of the organization" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "The unique slug of the organization" })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ description: "Logo URL" })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ description: "Description" })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ description: "The name of the organization" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "The unique slug of the organization" })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: "Logo URL" })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ description: "Description" })
  @IsString()
  @IsOptional()
  description?: string;
}

export class BanUserDto {
  @ApiPropertyOptional({ description: "The reason for banning the user" })
  @IsString()
  @IsOptional()
  banReason?: string;

  @ApiPropertyOptional({ description: "The expiration date of the ban" })
  @IsDateString()
  @IsOptional()
  banExpires?: string;
}

export class SetGlobalSettingDto {
  @ApiProperty({ description: "Setting key" })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: "Setting value" })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class DefineTierDto {
  @ApiProperty({ description: "Unique slug/id for the tier, e.g., 'growth'" })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: "Display name of the tier" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "Monthly or annual price of the tier" })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: "Description of the tier" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Tier limits (as a JSON/object, e.g., member limit, product limit)" })
  @IsOptional()
  limits?: Record<string, any>;

  @ApiPropertyOptional({ description: "Features enabled for this tier" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];
}

export class UpdateSubscriptionDto {
  @ApiProperty({ description: "Slug of the tier / plan" })
  @IsString()
  @IsNotEmpty()
  tierSlug: string;

  @ApiPropertyOptional({ description: "Dodo Customer ID" })
  @IsString()
  @IsOptional()
  dodoCustomerId?: string;

  @ApiPropertyOptional({ description: "Dodo Subscription ID" })
  @IsString()
  @IsOptional()
  dodoSubscriptionId?: string;

  @ApiPropertyOptional({ description: "Dodo Price ID" })
  @IsString()
  @IsOptional()
  dodoPriceId?: string;

  @ApiPropertyOptional({ description: "Dodo Subscription end period" })
  @IsDateString()
  @IsOptional()
  dodoCurrentPeriodEnd?: string;
}

export class RecordCustomPaymentDto {
  @ApiProperty({ description: "Target Organization ID" })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ description: "Paid amount" })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: "Phone number associated with payment" })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: "Payment reference / transaction code (e.g. M-Pesa Code)" })
  @IsString()
  @IsNotEmpty()
  reference: string;

  @ApiPropertyOptional({ description: "Upgrade organization subscription to this tier slug on successful payment" })
  @IsString()
  @IsOptional()
  tierSlug?: string;

  @ApiPropertyOptional({ description: "Custom notes/metadata for the payment" })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateIntegrationDefinitionDto {
  @ApiProperty({ description: "Name of integration" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "Slug of integration, e.g. shopify" })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ description: "Description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Logo URL" })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ enum: IntegrationCategory, description: "Category of integration" })
  @IsEnum(IntegrationCategory)
  category: IntegrationCategory;

  @ApiProperty({ enum: AuthType, description: "Auth type of integration" })
  @IsEnum(AuthType)
  authType: AuthType;

  @ApiPropertyOptional({ description: "Is this integration active and connectable" })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateIntegrationDefinitionDto {
  @ApiPropertyOptional({ description: "Name of integration" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "Slug of integration" })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: "Description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Logo URL" })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ enum: IntegrationCategory, description: "Category of integration" })
  @IsEnum(IntegrationCategory)
  @IsOptional()
  category?: IntegrationCategory;

  @ApiPropertyOptional({ enum: AuthType, description: "Auth type of integration" })
  @IsEnum(AuthType)
  @IsOptional()
  authType?: AuthType;

  @ApiPropertyOptional({ description: "Is this integration active and connectable" })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
