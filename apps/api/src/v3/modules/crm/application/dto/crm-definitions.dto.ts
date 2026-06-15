import {ApiProperty} from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  IsJSON,
} from "class-validator";
import {CrmFieldType} from "@repo/db";

export class CreateCrmObjectDto {
  @ApiProperty({example: "deal"})
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({example: "Deal"})
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({example: "Deals"})
  @IsString()
  @IsNotEmpty()
  labelPlural: string;

  @ApiProperty({example: "Sales opportunities"})
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({example: "briefcase"})
  @IsString()
  @IsOptional()
  icon?: string;
}

export class CreateCrmFieldDto {
  @ApiProperty({example: "stage"})
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({example: "Stage"})
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({enum: CrmFieldType, example: "SELECT"})
  @IsEnum(CrmFieldType)
  type: CrmFieldType;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsJSON()
  @IsOptional()
  options?: any;

  @IsInt()
  @IsOptional()
  order?: number;
}
