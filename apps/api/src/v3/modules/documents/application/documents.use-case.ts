import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { DocumentService } from "@/common/documents/document.service";
import {
  Mappers,
  generateQRCode,
  DocumentGenerator,
  resolveBranding,
  formatAddress,
  getInvoiceTemplate,
  getTemplateById,
  isV3Template,
  ReceiptTemplateV2,
  WaybillV3Document,
  DeliveryNoteV3Document,
  DeliveryNoteDocument,
  WaybillDocument,
  PackingListDocument,
} from "@repo/documents/server";
import { storageService } from "@repo/shared/storage";
import { documentService as sharedDocService } from "@repo/shared/lib";
import QRCode from "qrcode";
import { Readable } from "stream";

export type PrimaryDocumentType =
  | "invoice"
  | "receipt"
  | "waybill"
  | "delivery-note"
  | "packing-list";

@Injectable()
export class DocumentsUseCase {
  private readonly logger = new Logger(DocumentsUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentService: DocumentService,
  ) {}

  /**
   * Retrieves or generates a document stream for a given transaction or transfer,
   * automatically applying the organization's active document configuration and template.
   */
  async getDocumentStream(
    type: PrimaryDocumentType,
    id: string,
    organizationId: string,
    options: {
      template?: string;
      format?: string;
      skipCache?: boolean;
    } = {},
  ): Promise<{
    stream: NodeJS.ReadableStream;
    filename: string;
    contentType: string;
  }> {
    const transaction = await this.prisma.client.transaction.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        organization: {
          include: {
            settings: true,
            invoiceConfig: true,
            receiptConfig: true,
            waybillConfig: true,
            deliveryNoteConfig: true,
          },
        },
        customer: {
          include: {
            addresses: true,
          },
        },
        items: true,
        payments: true,
        location: true,
        member: {
          include: {
            user: { select: { name: true } },
          },
        },
        fulfillments: {
          include: {
            shippingAddress: true,
            driver: {
              include: {
                member: true,
              },
            },
          },
        },
        attachments: true,
      },
    });

    let transfer: any = null;
    let isStockTransfer = false;

    if (!transaction) {
      if (type === "packing-list") {
        transfer = await this.prisma.client.stockTransfer.findFirst({
          where: {
            id,
            organizationId,
          },
          include: {
            organization: {
              include: {
                settings: true,
                waybillConfig: true,
                deliveryNoteConfig: true,
              },
            },
            fromLocation: true,
            toLocation: true,
            items: {
              include: {
                variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        });

        if (transfer) {
          isStockTransfer = true;
        }
      }

      if (!isStockTransfer) {
        throw new NotFoundException(`Document or Transaction not found: ${id}`);
      }
    }

    // Check cached attachment if not skipping cache and not stock transfer
    if (!options.skipCache && transaction) {
      const descMap: Record<PrimaryDocumentType, string> = {
        invoice: "Invoice",
        receipt: "Receipt",
        waybill: "Waybill",
        "delivery-note": "Delivery Note",
        "packing-list": "Packing List",
      };

      const docDesc = descMap[type];
      const org = transaction.organization;
      let activeConfig: any = null;
      if (type === "invoice") activeConfig = org?.invoiceConfig;
      else if (type === "receipt") activeConfig = org?.receiptConfig;
      else if (type === "waybill") activeConfig = org?.waybillConfig;
      else if (type === "delivery-note")
        activeConfig = org?.deliveryNoteConfig || org?.waybillConfig;

      const configUpdatedAt = activeConfig?.updatedAt
        ? new Date(activeConfig.updatedAt)
        : null;
      const txUpdatedAt = new Date(transaction.updatedAt);
      const referenceDate =
        configUpdatedAt && configUpdatedAt > txUpdatedAt
          ? configUpdatedAt
          : txUpdatedAt;

      const cachedAttachment = transaction.attachments?.find(
        (a) =>
          (a.description === docDesc ||
            a.description?.toLowerCase().includes(type.replace("-", " "))) &&
          new Date(a.uploadedAt) >= referenceDate &&
          a.fileUrl,
      );

      if (cachedAttachment?.fileUrl) {
        try {
          const cachedStream = await storageService.getDownloadStream(
            cachedAttachment.fileUrl,
          );
          return {
            stream: cachedStream as NodeJS.ReadableStream,
            filename: `${type}-${transaction.number}.pdf`,
            contentType: "application/pdf",
          };
        } catch (err) {
          this.logger.warn(
            `Failed to retrieve cached attachment stream: ${err.message}. Regenerating document.`,
          );
        }
      }
    }

    let DocumentComponent: any;
    let data: any;
    let filename: string;
    let qrCode: string = "";

    const org = isStockTransfer ? transfer.organization : transaction.organization;
    const settings = org?.settings;

    switch (type) {
      case "invoice": {
        if (isStockTransfer) {
          throw new BadRequestException(
            "Invoice is not supported for stock transfer",
          );
        }

        const selectedTemplate =
          options.template || settings?.defaultInvoiceTemplate || "invoice-v2";

        if (selectedTemplate.startsWith("invoice-v3-")) {
          const v3Data = Mappers.toV3DocumentData(
            transaction as any,
            "invoice",
          );
          try {
            qrCode = await QRCode.toDataURL(transaction.number);
          } catch (e) {
            this.logger.warn("Failed to generate QR code", e);
          }

          const stream = await this.documentService.generateV3DocumentPDF(
            selectedTemplate,
            v3Data,
            qrCode,
          );

          return {
            stream: stream as NodeJS.ReadableStream,
            filename: `Invoice_${transaction.number}.pdf`,
            contentType: "application/pdf",
          };
        }

        DocumentComponent = getInvoiceTemplate(selectedTemplate);
        data = Mappers.toInvoiceData(transaction as any);
        filename = `Invoice_${transaction.number}.pdf`;

        try {
          qrCode = await QRCode.toDataURL(transaction.number);
        } catch (err) {
          this.logger.warn("Failed to generate QR code", err);
        }
        break;
      }

      case "receipt": {
        if (isStockTransfer) {
          throw new BadRequestException(
            "Receipt is not supported for stock transfer",
          );
        }

        const selectedTemplate =
          options.template || settings?.defaultReceiptTemplate || "receipt-v2";

        if (selectedTemplate.startsWith("receipt-v3-")) {
          const v3Data = Mappers.toV3DocumentData(
            transaction as any,
            "receipt",
          );
          try {
            qrCode = await QRCode.toDataURL(transaction.number);
          } catch (e) {
            this.logger.warn("Failed to generate QR code", e);
          }

          const stream = await this.documentService.generateV3DocumentPDF(
            selectedTemplate,
            v3Data,
            qrCode,
          );

          return {
            stream: stream as NodeJS.ReadableStream,
            filename: `Receipt_${transaction.number}.pdf`,
            contentType: "application/pdf",
          };
        }

        DocumentComponent = ReceiptTemplateV2;
        data = Mappers.toReceiptData(transaction as any);
        filename = `Receipt_${transaction.number}.pdf`;
        break;
      }

      case "waybill": {
        if (isStockTransfer) {
          throw new BadRequestException(
            "Waybill is not supported for stock transfer",
          );
        }

        const selectedTemplate =
          options.template || settings?.defaultWaybillTemplate || "waybill-v3";

        if (selectedTemplate === "waybill-v3") {
          DocumentComponent = WaybillV3Document;
        } else {
          DocumentComponent = WaybillDocument;
        }

        try {
          qrCode = await QRCode.toDataURL(transaction.number);
        } catch (e) {
          this.logger.warn("Failed to generate QR code", e);
        }

        data = Mappers.toWaybillData(
          transaction as any,
          transaction.fulfillments?.[0],
          qrCode,
        );
        filename = `Waybill_${transaction.number}.pdf`;
        break;
      }

      case "delivery-note": {
        if (isStockTransfer) {
          throw new BadRequestException(
            "Delivery note is not supported for stock transfer",
          );
        }

        const selectedTemplate =
          options.template ||
          settings?.defaultDeliveryNoteTemplate ||
          "delivery-note-v3";

        if (selectedTemplate === "delivery-note-v3") {
          DocumentComponent = DeliveryNoteV3Document;
        } else {
          DocumentComponent = DeliveryNoteDocument;
        }

        data = Mappers.toDeliveryNoteData(
          transaction as any,
          transaction.fulfillments?.[0],
        );
        filename = `DeliveryNote_${transaction.number}.pdf`;
        break;
      }

      case "packing-list": {
        DocumentComponent = PackingListDocument;
        if (isStockTransfer) {
          const branding = resolveBranding(
            transfer.organization,
            transfer.organization?.waybillConfig,
          );
          data = {
            id: transfer.id,
            number: `PL-${transfer.transferNumber}`,
            orderNumber: transfer.transferNumber,
            date: transfer.requestedDate || new Date(),
            branding,
            customer: {
              name: transfer.toLocation.name,
              address: transfer.toLocation.address
                ? formatAddress(transfer.toLocation.address)
                : undefined,
            },
            shippingAddress: transfer.toLocation.address
              ? formatAddress(transfer.toLocation.address)
              : transfer.toLocation.name,
            items: (transfer.items || []).map((item: any) => ({
              id: item.id,
              sku: item.variant?.sku || undefined,
              description: `${item.variant?.product?.name || "Item"}${item.variant?.name ? ` - ${item.variant.name}` : ""}`,
              quantity: Number(item.requestedQuantity || 0),
              quantityPacked: item.shippedQuantity
                ? Number(item.shippedQuantity)
                : Number(item.requestedQuantity || 0),
            })),
            notes: transfer.notes || undefined,
          };
          filename = `PackingList_${transfer.transferNumber}.pdf`;
        } else {
          data = Mappers.toPackingListData(
            transaction as any,
            transaction.fulfillments?.[0],
          );
          filename = `PackingList_${transaction.number}.pdf`;
        }
        break;
      }

      default:
        throw new BadRequestException(
          `Unsupported document type: ${type}`,
        );
    }

    const stream = (await DocumentGenerator.renderToStream(
      DocumentGenerator.createElement(DocumentComponent, {
        data,
        qrCode,
        settings,
      }),
    )) as NodeJS.ReadableStream;

    return {
      stream,
      filename,
      contentType: "application/pdf",
    };
  }

  /**
   * Retrieves the organization active document configuration for a specific type.
   */
  async getDocumentConfig(
    type: "invoice" | "receipt" | "waybill" | "delivery-note",
    organizationId: string,
  ) {
    if (type === "invoice") {
      let config = await this.prisma.client.invoiceConfig.findUnique({
        where: { organizationId },
      });
      if (!config) {
        config = await this.prisma.client.invoiceConfig.create({
          data: { organizationId },
        });
      }
      return config;
    }

    if (type === "receipt") {
      let config = await this.prisma.client.receiptConfig.findUnique({
        where: { organizationId },
      });
      if (!config) {
        config = await this.prisma.client.receiptConfig.create({
          data: { organizationId },
        });
      }
      return config;
    }

    if (type === "waybill") {
      let config = await this.prisma.client.waybillConfig.findUnique({
        where: { organizationId },
      });
      if (!config) {
        config = await this.prisma.client.waybillConfig.create({
          data: { organizationId },
        });
      }
      return config;
    }

    if (type === "delivery-note") {
      let config = await this.prisma.client.deliveryNoteConfig.findUnique({
        where: { organizationId },
      });
      if (!config) {
        config = await this.prisma.client.deliveryNoteConfig.create({
          data: { organizationId },
        });
      }
      return config;
    }

    throw new BadRequestException(`Unknown document config type: ${type}`);
  }

  /**
   * Updates document configuration and triggers cache invalidation for stored attachments.
   */
  async updateDocumentConfig(
    type: "invoice" | "receipt" | "waybill" | "delivery-note",
    organizationId: string,
    data: any,
  ) {
    let updatedConfig: any;

    if (type === "invoice") {
      updatedConfig = await this.prisma.client.invoiceConfig.upsert({
        where: { organizationId },
        update: data,
        create: { ...data, organizationId },
      });
    } else if (type === "receipt") {
      updatedConfig = await this.prisma.client.receiptConfig.upsert({
        where: { organizationId },
        update: data,
        create: { ...data, organizationId },
      });
    } else if (type === "waybill") {
      updatedConfig = await this.prisma.client.waybillConfig.upsert({
        where: { organizationId },
        update: data,
        create: { ...data, organizationId },
      });
    } else if (type === "delivery-note") {
      updatedConfig = await this.prisma.client.deliveryNoteConfig.upsert({
        where: { organizationId },
        update: data,
        create: { ...data, organizationId },
      });
    }

    return updatedConfig;
  }
}
