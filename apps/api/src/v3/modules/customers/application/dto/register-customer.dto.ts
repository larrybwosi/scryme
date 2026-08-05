import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class AddressDto {
  @ApiProperty({ example: "Home" })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ example: "123 Main St" })
  @IsString()
  @IsNotEmpty()
  street1: string;

  @ApiProperty({ example: "Suite 456", required: false })
  @IsString()
  @IsOptional()
  street2?: string;

  @ApiProperty({ example: "Nairobi" })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: "Nairobi", required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: "00100", required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: "Kenya" })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isDefault?: boolean;
}

export class RegisterCustomerDto {
  @ApiProperty({ example: "user_12345", required: false })
  @IsString()
  @IsOptional()
  zitadelUserId?: string;

  @ApiProperty({ example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "+254700000000", required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: "Nairobi, Kenya", required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: { preferences: "none" }, required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({ type: AddressDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiProperty({ example: "Acme Corp", required: false })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiProperty({ example: "Premium", required: false })
  @IsString()
  @IsOptional()
  customerType?: string;

  @ApiProperty({ example: "1990-01-01", required: false })
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ example: "PIN12345", required: false })
  @IsString()
  @IsOptional()
  taxId?: string;
}

export class ProvisionZitadelDto {
  @ApiProperty({ example: ["http://localhost:3000/api/auth/callback/zitadel"], required: false })
  @IsOptional()
  redirectUris?: string[];

  @ApiProperty({ example: ["http://localhost:3000"], required: false })
  @IsOptional()
  postLogoutRedirectUris?: string[];
}
