import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber } from "class-validator";

export class SaveKRAConfigDto {
  @IsEnum(["NAVARI", "DIRECT_ETIMS"])
  @IsOptional()
  provider?: string;

  @IsEnum(["SANDBOX", "PRODUCTION"])
  @IsOptional()
  environment?: string;

  @IsEnum(["BLOCKING", "ASYNC"])
  @IsOptional()
  enforcementMode?: string;

  @IsString()
  kraPin: string;

  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  branchCode?: string;

  @IsString()
  @IsOptional()
  deviceSerialNumber?: string;

  @IsString()
  @IsOptional()
  controlUnitId?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  apiSecret?: string;

  @IsNumber()
  @IsOptional()
  highValueThreshold?: number;

  @IsBoolean()
  @IsOptional()
  autoSyncSales?: boolean;

  @IsBoolean()
  @IsOptional()
  autoSyncPurchases?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ValidatePinDto {
  @IsString()
  kraPin: string;
}
