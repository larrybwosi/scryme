import {Processor, WorkerHost} from "@nestjs/bullmq";
import {Job} from "bullmq";
import {Logger} from "@nestjs/common";
import {PrismaService} from "@/prisma/prisma.service";

@Processor("cart-sync")
export class CartProcessor extends WorkerHost {
  private readonly logger = new Logger(CartProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // fallow-ignore-next-line unused-class-members
  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case "check-cart-inventory":
        return this.checkInventory(job.data);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async checkInventory(data: {
    cartId: string;
    productId: string;
    organizationId: string;
  }) {
    this.logger.log(
      `Checking inventory for cart ${data.cartId}, product ${data.productId}`,
    );
    // Implement inventory check logic here
    // For example, verify if the product is still in stock and notify the user if not
    return {success: true};
  }
}
