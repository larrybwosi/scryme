import {ApiProperty, ApiPropertyOptional, PartialType} from "@nestjs/swagger";
import {RegisterCustomerDto} from "./register-customer.dto";

export class UpdateCustomerDto extends PartialType(RegisterCustomerDto) {
  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  metadata?: any;
}
