import {
  DocumentGenerator,
  Mappers,
  SimpleInvoicePDF,
  DeliveryNoteDocument,
  getInvoiceTemplate,
  ReceiptTemplateV2,
} from "@repo/documents/server";
import { storageService } from "../../storage";
import { db } from "@repo/db";
import { notificationEngine } from "@repo/notifications";
import React from "react";
import QRCode from "qrcode";

export class DocumentService {
  /**
   * Generates and attaches Invoice and Delivery Note to a Transaction/Fulfillment.
   */
  async generateAndAttachProofDocuments(params: {
    transactionId: string;
    fulfillmentId: string;
    organizationId: string;
    memberId: string;
  }) {
    const { transactionId, fulfillmentId, organizationId, memberId } = params;

    // 1. Fetch transaction with targeted details
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId, organizationId },
      select: {
        id: true,
        number: true,
        createdAt: true,
        notes: true,
        subtotal: true,
        taxTotal: true,
        finalTotal: true,
        discountTotal: true,
        shippingTotal: true,
        dueDate: true,
        status: true,
        tags: true,
        currencyCode: true,
        items: {
          select: {
            id: true,
            productName: true,
            variantName: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
            subtotal: true,
            sku: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            addresses: {
              select: {
                id: true,
                street: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
                isDefault: true,
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            address: true,
            phone: true,
            email: true,
            website: true,
            description: true,
            primaryColor: true,
            settings: {
              select: {
                defaultCurrency: true,
                defaultTimezone: true,
                defaultInvoiceTemplate: true,
              },
            },
            invoiceConfig: {
              select: {
                showLogo: true,
                logoUrl: true,
                companyName: true,
                companyAddress: true,
                companyPhone: true,
                companyEmail: true,
                companyWebsite: true,
                companyTagline: true,
                primaryColor: true,
                showPoweredBy: true,
                watermarkText: true,
                customFields: true,
                invoiceNumberPrefix: true,
                invoiceNumberSuffix: true,
                invoiceNumberPadding: true,
                defaultNotes: true,
                defaultTerms: true,
                footerText: true,
              },
            },
            waybillConfig: {
              select: {
                showLogo: true,
                logoUrl: true,
                companyName: true,
                companyAddress: true,
                companyPhone: true,
                companyEmail: true,
                companyWebsite: true,
                companyTagline: true,
                primaryColor: true,
                showPoweredBy: true,
                watermarkText: true,
                customFields: true,
              },
            },
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        member: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            method: true,
            amount: true,
            amountReceived: true,
            change: true,
          },
        },
        fulfillments: {
          where: { id: fulfillmentId },
          select: {
            id: true,
            createdAt: true,
            deliveryNotes: true,
            shippingAddress: {
              select: {
                id: true,
                name: true,
                phone: true,
                street: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
              },
            },
            driver: {
              select: {
                member: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!transaction) throw new Error("Transaction not found");
    const fulfillment = transaction.fulfillments[0];
    if (!fulfillment) throw new Error("Fulfillment not found");

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.fulfillment.update({
      where: { id: fulfillmentId },
      data: { confirmationToken: otp },
    });

    // 3. Generate and save Invoice & Delivery Note
    await Promise.all([
      this.generateAndSaveInvoice(transactionId, organizationId, memberId),
      (async () => {
        const dnData = Mappers.toDeliveryNoteData(transaction, fulfillment);
        const dnStream = await DocumentGenerator.renderToStream(
          React.createElement(DeliveryNoteDocument, { data: dnData }),
        );
        const dnBuffer = await this.streamToBuffer(dnStream);
        const dnFileName = `delivery-note-${transaction.number}-${Date.now()}.pdf`;
        const dnUpload = await storageService.upload(
          dnBuffer,
          dnFileName,
          "application/pdf",
          { organizationId },
        );
        const { StorageCoreService } = await import("../../storage");
        const { shortCode, shortUrl } =
          StorageCoreService.generateShortUrlInfo();

        await db.attachment.create({
          data: {
            organizationId,
            memberId,
            transactionId,
            fulfillmentId,
            fileName: dnFileName,
            fileUrl: dnUpload.url,
            shortCode,
            shortUrl,
            mimeType: "application/pdf",
            isPublic: true,
            description: "Auto-generated Delivery Note",
            sizeBytes: dnBuffer.length,
          },
        });
      })(),
    ]);

    // 4. Send OTP to customer if they have contact info
    if (transaction.customer?.email) {
      try {
        await notificationEngine.notify({
          organizationId,
          templateName: "DELIVERY_OTP",
          data: {
            otp,
            customerName: transaction.customer.name,
            orderNumber: transaction.number,
          },
          recipients: {
            userIds: (transaction.customer as any).userId
              ? [(transaction.customer as any).userId]
              : [],
          },
          channels: ["EMAIL"],
        });
      } catch (e) {
        console.error("Failed to send OTP email:", e);
      }
    }

    return { otp };
  }

  /**
   * Generates and saves an Invoice for a transaction.
   */
  async generateAndSaveInvoice(
    transactionId: string,
    organizationId: string,
    memberId: string | null,
  ) {
    let effectiveMemberId = memberId;

    if (!effectiveMemberId) {
      const firstMember = await db.member.findFirst({
        where: { organizationId, role: "OWNER" },
        select: { id: true },
      });
      effectiveMemberId = firstMember?.id || null;
    }

    if (!effectiveMemberId) {
      throw new Error("No valid member found to associate with the document");
    }

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId, organizationId },
      select: {
        id: true,
        number: true,
        createdAt: true,
        notes: true,
        subtotal: true,
        taxTotal: true,
        finalTotal: true,
        discountTotal: true,
        shippingTotal: true,
        dueDate: true,
        status: true,
        tags: true,
        currencyCode: true,
        items: {
          select: {
            id: true,
            productName: true,
            variantName: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
            subtotal: true,
            sku: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            addresses: {
              select: {
                id: true,
                street: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
                isDefault: true,
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            address: true,
            phone: true,
            email: true,
            website: true,
            description: true,
            primaryColor: true,
            settings: {
              select: {
                defaultCurrency: true,
                defaultTimezone: true,
                defaultInvoiceTemplate: true,
              },
            },
            invoiceConfig: {
              select: {
                showLogo: true,
                logoUrl: true,
                companyName: true,
                companyAddress: true,
                companyPhone: true,
                companyEmail: true,
                companyWebsite: true,
                companyTagline: true,
                primaryColor: true,
                showPoweredBy: true,
                watermarkText: true,
                customFields: true,
                invoiceNumberPrefix: true,
                invoiceNumberSuffix: true,
                invoiceNumberPadding: true,
                defaultNotes: true,
                defaultTerms: true,
                footerText: true,
              },
            },
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        member: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            method: true,
            amount: true,
            amountReceived: true,
            change: true,
          },
        },
      },
    });

    if (!transaction) throw new Error("Transaction not found");

    const template = transaction.organization?.settings?.defaultInvoiceTemplate;
    const DocumentComponent = getInvoiceTemplate(template);
    const documentData = Mappers.toInvoiceData(transaction);

    let qrCode = "";
    try {
      qrCode = await QRCode.toDataURL(transaction.number);
    } catch (err) {
      console.error("Failed to generate QR code", err);
    }

    const stream = await DocumentGenerator.renderToStream(
      React.createElement(DocumentComponent, { data: documentData, qrCode }),
    );
    const buffer = await this.streamToBuffer(stream);

    const fileName = `invoice-${transaction.number}-${Date.now()}.pdf`;
    const upload = await storageService.upload(
      buffer,
      fileName,
      "application/pdf",
      { organizationId },
    );

    const { StorageCoreService } = await import("../../storage");
    const { shortCode, shortUrl } = StorageCoreService.generateShortUrlInfo();

    return await db.attachment.create({
      data: {
        organizationId,
        memberId: effectiveMemberId,
        transactionId,
        fileName,
        fileUrl: upload.url,
        shortCode,
        shortUrl,
        mimeType: "application/pdf",
        isPublic: true,
        description: "Invoice",
        sizeBytes: buffer.length,
      },
    });
  }

  /**
   * Generates and saves a Receipt for a transaction.
   */
  async generateAndSaveReceipt(
    transactionId: string,
    organizationId: string,
    memberId: string | null,
  ) {
    let effectiveMemberId = memberId;

    if (!effectiveMemberId) {
      const firstMember = await db.member.findFirst({
        where: { organizationId, role: "OWNER" },
        select: { id: true },
      });
      effectiveMemberId = firstMember?.id || null;
    }

    if (!effectiveMemberId) {
      throw new Error("No valid member found to associate with the document");
    }

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId, organizationId },
      select: {
        id: true,
        number: true,
        createdAt: true,
        notes: true,
        subtotal: true,
        taxTotal: true,
        finalTotal: true,
        discountTotal: true,
        shippingTotal: true,
        dueDate: true,
        status: true,
        tags: true,
        currencyCode: true,
        items: {
          select: {
            id: true,
            productName: true,
            variantName: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
            subtotal: true,
            sku: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            addresses: {
              select: {
                id: true,
                street: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
                isDefault: true,
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            address: true,
            phone: true,
            email: true,
            website: true,
            description: true,
            primaryColor: true,
            settings: {
              select: {
                defaultCurrency: true,
                defaultTimezone: true,
              },
            },
            receiptConfig: {
              select: {
                showLogo: true,
                logoUrl: true,
                companyName: true,
                companyAddress: true,
                companyPhone: true,
                companyEmail: true,
                companyWebsite: true,
                companyTagline: true,
                primaryColor: true,
                showPoweredBy: true,
                watermarkText: true,
                customFields: true,
              },
            },
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        member: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            method: true,
            amount: true,
            amountReceived: true,
            change: true,
          },
        },
      },
    });

    if (!transaction) throw new Error("Transaction not found");

    const documentData = Mappers.toReceiptData(transaction);
    const stream = await DocumentGenerator.renderToStream(
      React.createElement(ReceiptTemplateV2, { data: documentData }),
    );
    const buffer = await this.streamToBuffer(stream);

    const fileName = `receipt-${transaction.number}-${Date.now()}.pdf`;
    const upload = await storageService.upload(
      buffer,
      fileName,
      "application/pdf",
      { organizationId },
    );

    const { StorageCoreService } = await import("../../storage");
    const { shortCode, shortUrl } = StorageCoreService.generateShortUrlInfo();

    return await db.attachment.create({
      data: {
        organizationId,
        memberId: effectiveMemberId,
        transactionId,
        fileName,
        fileUrl: upload.url,
        shortCode,
        shortUrl,
        mimeType: "application/pdf",
        isPublic: true,
        description: "Receipt",
        sizeBytes: buffer.length,
      },
    });
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: any[] = [];
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }
}

export const documentService = new DocumentService();
