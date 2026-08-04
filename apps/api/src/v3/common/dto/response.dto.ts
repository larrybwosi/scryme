import { applyDecorators, Type } from "@nestjs/common";
import { ApiProperty, ApiResponse, getSchemaPath, ApiExtraModels } from "@nestjs/swagger";

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({
    example: {
      message: "Invalid request parameters",
      code: "BAD_REQUEST",
      details: ["email must be an email"],
    },
  })
  error: {
    message: string;
    code: string;
    details?: any;
  };

  @ApiProperty({ example: "2023-10-27T10:00:00.000Z" })
  timestamp: string;
}

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: "2023-10-27T10:00:00.000Z" })
  timestamp: string;

  @ApiProperty({ required: false })
  meta?: any;
}

export function ApiStandardResponse<TModel extends Type<any>>(options: {
  status: number;
  type?: TModel | [TModel] | string;
  description?: string;
}) {
  if (!options.type) {
    return ApiResponse({
      status: options.status,
      description: options.description,
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object", nullable: true, example: null },
          timestamp: { type: "string", example: "2023-10-27T10:00:00.000Z" },
          meta: { type: "object", nullable: true },
        },
        required: ["success", "data", "timestamp"],
      },
    });
  }

  const isArray = Array.isArray(options.type);
  const isString = typeof options.type === "string";

  if (isString) {
    return ApiResponse({
      status: options.status,
      description: options.description,
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "string", example: options.type },
          timestamp: { type: "string", example: "2023-10-27T10:00:00.000Z" },
          meta: { type: "object", nullable: true },
        },
        required: ["success", "data", "timestamp"],
      },
    });
  }

  const targetType = isArray ? (options.type as [TModel])[0] : (options.type as TModel);

  return applyDecorators(
    ApiExtraModels(ApiResponseDto, targetType),
    ApiResponse({
      status: options.status,
      description: options.description,
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: isArray
            ? { type: "array", items: { $ref: getSchemaPath(targetType) } }
            : { $ref: getSchemaPath(targetType) },
          timestamp: { type: "string", example: "2023-10-27T10:00:00.000Z" },
          meta: { type: "object", nullable: true },
        },
        required: ["success", "data", "timestamp"],
      },
    }),
  );
}
