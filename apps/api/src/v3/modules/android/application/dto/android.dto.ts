import { IsString, IsNotEmpty, IsOptional, IsObject } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterDeviceDto {
  @ApiProperty({ description: "Unique hardware or installation ID for the Android device" })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiPropertyOptional({ description: "Android model name (e.g. Pixel 8, Samsung POS)" })
  @IsString()
  @IsOptional()
  modelName?: string;

  @ApiPropertyOptional({ description: "Android OS version (e.g. Android 14)" })
  @IsString()
  @IsOptional()
  osVersion?: string;

  @ApiPropertyOptional({ description: "App version string (e.g. 1.2.0)" })
  @IsString()
  @IsOptional()
  appVersion?: string;

  @ApiPropertyOptional({ description: "Firebase Cloud Messaging (FCM) or push notification token" })
  @IsString()
  @IsOptional()
  pushToken?: string;

  @ApiPropertyOptional({ description: "Additional device metadata/hardware specs" })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SwitchOrgDto {
  @ApiProperty({ description: "Target organization ID to switch active context to" })
  @IsString()
  @IsNotEmpty()
  organizationId: string;
}
