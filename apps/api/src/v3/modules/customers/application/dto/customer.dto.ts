import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CustomerResponseDto {
  @ApiProperty({ example: "cust_123" })
  id: string;

  @ApiProperty({ example: "John Doe" })
  name: string;

  @ApiProperty({ example: "john@example.com" })
  email: string;

  @ApiProperty({ example: "+1234567890" })
  phone: string;

  @ApiPropertyOptional({ example: "Acme Corp" })
  company?: string;

  @ApiPropertyOptional({ example: "Premium" })
  customerType?: string;

  @ApiPropertyOptional({ example: "1990-01-01" })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: "PIN12345" })
  taxId?: string;
}
