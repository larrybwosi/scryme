import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {Type} from "class-transformer";
import {IsOptional, IsInt, Min, IsString} from "class-validator";

export class PaginationQueryDto {
  @ApiPropertyOptional({default: 1})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({default: 10})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({enum: ["asc", "desc"], default: "desc"})
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc" = "desc";
}
