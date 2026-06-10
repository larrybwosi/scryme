import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'COMPLETED', description: 'The new status of the order' })
  @IsString()
  @IsNotEmpty()
  status: string;
}

export class OrderResponseDto {
  @ApiProperty({ example: 'ord_123' })
  id: string;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: 45.99 })
  totalAmount: number;

  @ApiProperty({ example: '2023-10-27T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: 'LPO-2023-001', required: false })
  lpoNumber?: string;

  @ApiProperty({ example: '2023-10-01T00:00:00Z', required: false })
  lpoDate?: Date;

  @ApiProperty({ example: '2023-12-31T00:00:00Z', required: false })
  lpoExpiryDate?: Date;

  @ApiProperty({ example: 'https://storage.example.com/lpos/lpo-001.pdf', required: false })
  lpoUrl?: string;
}
