import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsInt, Min, Max, IsString } from "class-validator";
import { Type } from "class-transformer";

export class PaginationQueryDto {
  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class PaginatedResponse<T> {
  data: T[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset?: number;

  @ApiProperty()
  nextCursor?: string;
}

/**
 * Paginates Prisma query results.
 * ⚡ Bolt: Added support for 'select' and 'include' to prevent over-fetching.
 */
export async function paginate<T>(
  repository: any,
  query: PaginationQueryDto,
  where: any = {},
  orderBy: any = { createdAt: "desc" },
  options: { select?: any; include?: any } = {},
) {
  const { limit = 20, offset = 0, cursor } = query;

  const findManyArgs: any = {
    where,
    take: limit,
    orderBy,
    ...options,
  };

  if (cursor) {
    findManyArgs.cursor = { id: cursor };
    findManyArgs.skip = 1; // Skip the cursor itself
  } else {
    findManyArgs.skip = offset;
  }

  const [data, total] = await Promise.all([
    repository.findMany(findManyArgs),
    repository.count({ where }),
  ]);

  const nextCursor =
    data.length === limit ? data[data.length - 1].id : undefined;

  return {
    data,
    total,
    limit,
    offset: cursor ? undefined : offset,
    nextCursor,
  };
}
