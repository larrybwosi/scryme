import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class RedeemRewardDto {
  @ApiProperty({ example: "cust_123", description: "The ID of the customer" })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: "rew_123", description: "The ID of the reward to redeem" })
  @IsString()
  @IsNotEmpty()
  rewardId: string;
}

export class ValidateVoucherDto {
  @ApiProperty({ example: "SAVE10", description: "The voucher code to validate" })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: "cust_123", description: "The ID of the customer" })
  @IsString()
  @IsNotEmpty()
  customerId: string;
}

export class LoyaltyStatusResponseDto {
  @ApiProperty({ example: 500, description: "Current points balance" })
  points: number;

  @ApiProperty({ example: "Gold", description: "Current loyalty tier" })
  tier: string;

  @ApiProperty({ type: [Object], description: "List of available rewards" })
  availableRewards: any[];
}
