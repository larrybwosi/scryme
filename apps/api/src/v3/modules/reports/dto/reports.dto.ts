import { IsBoolean, IsOptional, IsString, IsArray, IsInt, IsNumber, Min, Max } from "class-validator";

export class UpdateReportSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  scrymeEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[];

  @IsOptional()
  @IsString()
  scrymeChannel?: string;

  @IsOptional()
  @IsBoolean()
  scheduleEnabled?: boolean;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  timeOfDay?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  includeSales?: boolean;

  @IsOptional()
  @IsBoolean()
  includeInventory?: boolean;

  @IsOptional()
  @IsBoolean()
  includeProduction?: boolean;

  @IsOptional()
  @IsBoolean()
  includeTax?: boolean;

  @IsOptional()
  @IsBoolean()
  includeAiInsights?: boolean;

  // Customization & Scopes
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  formats?: string[];

  @IsOptional()
  @IsString()
  defaultLocationId?: string;

  @IsOptional()
  @IsString()
  defaultDepartmentId?: string;

  @IsOptional()
  @IsNumber()
  minRevenueThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  summaryPeriodDays?: number;

  // Automation & Workflows
  @IsOptional()
  @IsBoolean()
  workflowEnabled?: boolean;

  @IsOptional()
  @IsString()
  workflowKey?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;
}

export class GenerateReportDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 7;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean = true;

  @IsOptional()
  @IsBoolean()
  sendScryme?: boolean = true;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  formats?: string[];
}
