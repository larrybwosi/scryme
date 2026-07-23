import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
} from "class-validator";

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
