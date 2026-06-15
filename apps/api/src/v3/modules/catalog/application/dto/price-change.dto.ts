import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {IsString, IsOptional, IsEnum} from "class-validator";
import {PriceChangeStatus} from "@repo/db";

export class ReviewPriceChangeDto {
  @ApiProperty({
    enum: PriceChangeStatus,
    description: "New status (APPROVED or REJECTED)",
  })
  @IsEnum([PriceChangeStatus.APPROVED, PriceChangeStatus.REJECTED])
  status: PriceChangeStatus;

  @ApiPropertyOptional({description: "Reason for rejection"})
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
