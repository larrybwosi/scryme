import {ApiProperty} from "@nestjs/swagger";
import {IsString, IsOptional, IsArray} from "class-validator";

export class CheckB2BAvailabilityDto {
  @ApiProperty({required: false})
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiProperty({required: false})
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({required: false})
  @IsString()
  @IsOptional()
  businessAccountId?: string;

  @ApiProperty({type: [String]})
  @IsArray()
  @IsString({each: true})
  variantIds: string[];
}
