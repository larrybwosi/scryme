import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsInt, Min, Max, IsBoolean } from "class-validator";
import { Type } from "class-transformer";

export class GetShiftsQueryDto {
  @ApiPropertyOptional({ description: "Filter shifts by member ID" })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({
    description: "Filter shifts by day of the week (0 = Sunday, 6 = Saturday)",
    minimum: 0,
    maximum: 6,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ description: "Filter shifts by active status", type: Boolean })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
