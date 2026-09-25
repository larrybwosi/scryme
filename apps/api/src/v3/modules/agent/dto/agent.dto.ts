import { IsString, IsNotEmpty, IsOptional, IsObject } from "class-validator";

export class SendAgentMessageDto {
  @IsString()
  @IsNotEmpty()
  channel: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RequestAgentApprovalDto {
  @IsString()
  @IsNotEmpty()
  channel: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsNotEmpty()
  details: string;

  @IsString()
  @IsOptional()
  requestedBy?: string;
}

export class HandleAgentApprovalCallbackDto {
  @IsString()
  @IsNotEmpty()
  approvalId: string;

  @IsString()
  @IsNotEmpty()
  decision: "APPROVED" | "DECLINED";

  @IsString()
  @IsOptional()
  reason?: string;
}
