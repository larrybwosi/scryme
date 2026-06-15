import {
  Controller,
  Post,
  Body,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import {ApiTags, ApiOperation, ApiResponse} from "@nestjs/swagger";
import {WindmillCallbackUseCase} from "../../application/use-cases/WindmillCallbackUseCase";
import {
  type ApprovalCallbackPayload,
  type BakeryDisposalCallbackPayload,
  type WindmillCallbackPayload,
  type GenericOutcomePayload,
} from "@repo/windmill/server";

@ApiTags("V3 Windmill Webhooks")
@Controller("webhooks/windmill")
export class WindmillCallbackController {
  private readonly logger = new Logger(WindmillCallbackController.name);

  constructor(private readonly callbackUseCase: WindmillCallbackUseCase) {}

  @Post()
  @ApiOperation({summary: "Handle status callbacks from Windmill (V3)"})
  @ApiResponse({status: 200, description: "Callback processed successfully"})
  async handleCallback(@Body() payload: WindmillCallbackPayload) {
    try {
      return await this.callbackUseCase.handleGeneralCallback(payload);
    } catch (error) {
      this.logger.error(
        `Error processing V3 Windmill callback: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException("Failed to process callback");
    }
  }

  @Post("approval")
  @ApiOperation({summary: "Handle approval callbacks from Windmill (V3)"})
  async handleApprovalCallback(@Body() payload: ApprovalCallbackPayload) {
    try {
      return await this.callbackUseCase.handleApprovalCallback(payload);
    } catch (error) {
      this.logger.error(
        `Error processing V3 Approval callback: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        "Failed to process approval callback",
      );
    }
  }

  @Post("bakery/disposal")
  @ApiOperation({
    summary: "Handle bakery disposal callbacks from Windmill (V3)",
  })
  async handleBakeryDisposalCallback(
    @Body() payload: BakeryDisposalCallbackPayload,
  ) {
    try {
      return await this.callbackUseCase.handleBakeryDisposalCallback(payload);
    } catch (error) {
      this.logger.error(
        `Error processing V3 Bakery Disposal callback: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        "Failed to process bakery disposal callback",
      );
    }
  }

  @Post("outcome")
  @ApiOperation({
    summary: "Handle generic outcome callbacks from Windmill (V3)",
  })
  async handleOutcomeCallback(@Body() payload: GenericOutcomePayload) {
    try {
      return await this.callbackUseCase.handleOutcomeCallback(payload);
    } catch (error) {
      this.logger.error(
        `Error processing V3 Outcome callback: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        "Failed to process outcome callback",
      );
    }
  }
}
