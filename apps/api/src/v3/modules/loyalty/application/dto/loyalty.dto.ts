import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";

export enum LoyaltyRuleTypeDto {
  POINTS_PER_CURRENCY = "POINTS_PER_CURRENCY",
  POINTS_PER_ITEM = "POINTS_PER_ITEM",
  FIXED_POINTS = "FIXED_POINTS",
}

export enum LoyaltyRewardTypeDto {
  DISCOUNT_PERCENTAGE = "DISCOUNT_PERCENTAGE",
  DISCOUNT_FIXED_AMOUNT = "DISCOUNT_FIXED_AMOUNT",
  FREE_PRODUCT = "FREE_PRODUCT",
  STORE_CREDIT = "STORE_CREDIT",
}

export enum TierBasisDto {
  CURRENT_BALANCE = "CURRENT_BALANCE",
  LIFETIME_POINTS = "LIFETIME_POINTS",
}

export class UpsertLoyaltyProgramDto {
  @ApiProperty({ example: "VIP Club", description: "Program name" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: "Customer loyalty & rewards program" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: "Points" })
  @IsString()
  @IsOptional()
  pointsLabel?: string;

  @ApiPropertyOptional({ example: 100, description: "Points per 1 currency unit when redeeming" })
  @IsNumber()
  @IsOptional()
  @Min(0.0001)
  exchangeRate?: number;

  @ApiPropertyOptional({ example: 12, description: "Points expire after X months (null = never)" })
  @IsNumber()
  @IsOptional()
  expiryMonths?: number | null;

  @ApiPropertyOptional({ enum: TierBasisDto, default: TierBasisDto.CURRENT_BALANCE })
  @IsEnum(TierBasisDto)
  @IsOptional()
  tierBasis?: TierBasisDto;

  @ApiPropertyOptional({ example: 50, description: "Minimum points balance before customer can redeem" })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minRedeemPoints?: number;

  @ApiPropertyOptional({ example: 100, description: "Max % of sale total covered by points (e.g. 50 = 50%)" })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  maxRedemptionPercentage?: number;

  @ApiPropertyOptional({ example: true, description: "Allow direct pay-with-points at checkout" })
  @IsBoolean()
  @IsOptional()
  allowDirectRedemption?: boolean;
}

export class CreateLoyaltyTierDto {
  @ApiProperty({ example: "Gold", description: "Tier name" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: "Gold tier for active members" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 500, description: "Minimum points required" })
  @IsNumber()
  @Min(0)
  minPoints: number;

  @ApiPropertyOptional({ example: 1.25, description: "Point multiplier (e.g. 1.25x)" })
  @IsNumber()
  @IsOptional()
  @Min(1.0)
  multiplier?: number;

  @ApiPropertyOptional({ example: "#F59E0B" })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: "crown" })
  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateLoyaltyTierDto {
  @ApiPropertyOptional({ example: "Gold" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: "Gold tier description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minPoints?: number;

  @ApiPropertyOptional({ example: 1.25 })
  @IsNumber()
  @IsOptional()
  @Min(1.0)
  multiplier?: number;

  @ApiPropertyOptional({ example: "#F59E0B" })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: "crown" })
  @IsString()
  @IsOptional()
  icon?: string;
}

export class CreateLoyaltyRuleDto {
  @ApiProperty({ example: "Spend $1 get 1 pt" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: LoyaltyRuleTypeDto })
  @IsEnum(LoyaltyRuleTypeDto)
  ruleType: LoyaltyRuleTypeDto;

  @ApiProperty({ example: 1, description: "Points to award" })
  @IsNumber()
  @Min(0)
  pointsValue: number;

  @ApiPropertyOptional({ example: 1.0, description: "Currency amount for POINTS_PER_CURRENCY" })
  @IsNumber()
  @IsOptional()
  currencyAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiPropertyOptional({ example: 10.0 })
  @IsNumber()
  @IsOptional()
  minOrderValue?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  validTo?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateLoyaltyRuleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: LoyaltyRuleTypeDto })
  @IsEnum(LoyaltyRuleTypeDto)
  @IsOptional()
  ruleType?: LoyaltyRuleTypeDto;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  pointsValue?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  currencyAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  minOrderValue?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  validTo?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateLoyaltyRewardDto {
  @ApiProperty({ example: "$5 Discount Voucher" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: LoyaltyRewardTypeDto })
  @IsEnum(LoyaltyRewardTypeDto)
  rewardType: LoyaltyRewardTypeDto;

  @ApiProperty({ example: 100, description: "Points required to redeem" })
  @IsNumber()
  @Min(1)
  pointsRequired: number;

  @ApiPropertyOptional({ example: 5.0, description: "Discount value ($ or %)" })
  @IsNumber()
  @IsOptional()
  discountValue?: number;

  @ApiPropertyOptional({ description: "Product ID for FREE_PRODUCT reward" })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateLoyaltyRewardDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: LoyaltyRewardTypeDto })
  @IsEnum(LoyaltyRewardTypeDto)
  @IsOptional()
  rewardType?: LoyaltyRewardTypeDto;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  pointsRequired?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  discountValue?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AdjustPointsDto {
  @ApiProperty({ example: 50, description: "Points to add (positive) or deduct (negative)" })
  @IsNumber()
  points: number;

  @ApiProperty({ example: "Customer loyalty compensation", description: "Mandatory reason for audit" })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class DirectRedeemPointsDto {
  @ApiProperty({ example: "cust_123" })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 200, description: "Points to redeem directly for discount" })
  @IsNumber()
  @Min(1)
  points: number;

  @ApiProperty({ example: 50.0, description: "Current order total to apply discount against" })
  @IsNumber()
  @Min(0.01)
  orderTotal: number;

  @ApiPropertyOptional({ example: "txn_123" })
  @IsString()
  @IsOptional()
  transactionId?: string;
}

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

  @ApiPropertyOptional({ example: 1.25 })
  multiplier: number;

  @ApiProperty({ type: [Object], description: "List of available rewards" })
  availableRewards: any[];
}
