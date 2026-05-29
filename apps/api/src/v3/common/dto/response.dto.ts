import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({
    example: {
      message: 'Invalid request parameters',
      code: 'BAD_REQUEST',
      details: ['email must be an email'],
    },
  })
  error: {
    message: string;
    code: string;
    details?: any;
  };

  @ApiProperty({ example: '2023-10-27T10:00:00.000Z' })
  timestamp: string;
}

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: '2023-10-27T10:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ required: false })
  meta?: any;
}
