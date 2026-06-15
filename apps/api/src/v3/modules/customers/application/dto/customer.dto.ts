import {ApiProperty} from "@nestjs/swagger";

export class CustomerResponseDto {
  @ApiProperty({example: "cust_123"})
  id: string;

  @ApiProperty({example: "John Doe"})
  name: string;

  @ApiProperty({example: "john@example.com"})
  email: string;

  @ApiProperty({example: "+1234567890"})
  phone: string;
}
