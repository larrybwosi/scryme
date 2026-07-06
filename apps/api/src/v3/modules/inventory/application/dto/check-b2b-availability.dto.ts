import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsArray } from "class-validator";

export class CheckB2BAvailabilityDto {
  @ApiProperty({
    description: "Optional location ID to check stock at. If omitted, checks all organization locations.",
    required: false,
    example: "loc_123",
  })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiProperty({
    description: "The ID of the customer requesting the check",
    required: false,
    example: "cust_123",
  })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({
    description: "The business account ID for B2B pricing and availability rules",
    required: false,
    example: "ba_123",
  })
  @IsString()
  @IsOptional()
  businessAccountId?: string;

  @ApiProperty({
    description: "Array of variant IDs to check for availability",
    type: [String],
    example: ["var_1", "var_2"],
  })
  @IsArray()
  @IsString({ each: true })
  variantIds: string[];
}
