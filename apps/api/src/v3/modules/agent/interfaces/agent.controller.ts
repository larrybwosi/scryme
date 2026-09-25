import { Controller, Post, Body, Param, UseGuards, Req } from "@nestjs/common";
import { AgentService } from "../agent.service";
import { SendAgentMessageDto, RequestAgentApprovalDto, HandleAgentApprovalCallbackDto } from "../dto/agent.dto";
import { V3AuthGuard, PermissionsGuard, Permissions, V3Context } from "../../../common/auth";

@Controller("v3/:orgSlug/agent")
@UseGuards(V3AuthGuard, PermissionsGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post("messages")
  @Permissions("agent:write", "messages:write")
  async sendMessage(
    @Param("orgSlug") orgSlug: string,
    @Body() dto: SendAgentMessageDto,
  ) {
    const res = await this.agentService.sendMessage(orgSlug, dto);
    return { success: true, data: res };
  }

  @Post("approvals")
  @Permissions("agent:write", "approvals:write")
  async requestApproval(
    @Param("orgSlug") orgSlug: string,
    @Body() dto: RequestAgentApprovalDto,
  ) {
    const res = await this.agentService.requestApproval(orgSlug, dto);
    return { success: true, data: res };
  }

  @Post("approvals/callback")
  @Permissions("agent:write", "approvals:write")
  async handleApprovalCallback(
    @Param("orgSlug") orgSlug: string,
    @Body() dto: HandleAgentApprovalCallbackDto,
  ) {
    const res = await this.agentService.handleApprovalCallback(orgSlug, dto);
    return { success: true, data: res };
  }
}
