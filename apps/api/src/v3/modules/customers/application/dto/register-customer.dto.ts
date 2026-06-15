import {ApiProperty} from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
} from "class-validator";
import {Type} from "class-transformer";

export class AddressDto {
  @ApiProperty({example: "Home"})
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({example: "123 Main St"})
  @IsString()
  @IsNotEmpty()
  street1: string;

  @ApiProperty({example: "Suite 456", required: false})
  @IsString()
  @IsOptional()
  street2?: string;

  @ApiProperty({example: "Nairobi"})
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({example: "Nairobi", required: false})
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({example: "00100", required: false})
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({example: "Kenya"})
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({example: true, required: false})
  @IsOptional()
  isDefault?: boolean;
}

export class RegisterCustomerDto {
  @ApiProperty({example: "user_12345"})
  @IsString()
  @IsNotEmpty()
  zitadelUserId: string;

  @ApiProperty({example: "John Doe"})
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({example: "john@example.com"})
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({example: "+254700000000", required: false})
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({example: "Nairobi, Kenya", required: false})
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({example: {preferences: "none"}, required: false})
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({type: AddressDto, required: false})
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}
