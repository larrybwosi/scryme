import { Module } from "@nestjs/common";
import { AgentController } from "./interfaces/agent.controller";
import { AgentService } from "./agent.service";

@Module({
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
