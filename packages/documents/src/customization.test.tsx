import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import {
  InvoiceTemplate,
  ReceiptTemplateV2 as ReceiptTemplate,
} from "./index";
import { BrandingOptions } from "./types";

// Mock @react-pdf/renderer to avoid rendering complex PDFs in tests
vi.mock("@react-pdf/renderer", async () => {
  const actual = await vi.importActual("@react-pdf/renderer");
  return {
    ...actual,
    PDFViewer: ({ children }: any) => <div>{children}</div>,
    Document: ({ children }: any) => <div>{children}</div>,
    Page: ({ children }: any) => <div>{children}</div>,
    View: ({ children }: any) => <div>{children}</div>,
    Text: ({ children }: any) => <div>{children}</div>,
    Image: (props: any) => <img {...props} />,
    StyleSheet: {
      create: (s: any) => s,
    },
  };
});

describe("Document Branding and Customization", () => {
  const mockBranding: BrandingOptions = {
    primaryColor: "#FF5733",
    companyName: "Acme Corp Custom",
    logoUrl: "https://example.com/logo.png",
    companyAddress: "123 Custom St, Design City",
  };

  const mockInvoiceData: any = {
    id: "inv-123",
    number: "INV-123",
    invoiceNumber: "INV-123",
    date: "2023-10-27",
    status: "PAID",
    customerName: "John Doe",
    branding: mockBranding,
    items: [
      {
        id: "item-1",
        description: "Test Product",
        quantity: 2,
        unitPrice: 50,
        totalPrice: 100,
      },
    ],
    subtotal: 100,
    tax: 10,
    total: 110,
  };

  const mockReceiptData: any = {
    id: "rec-123",
    number: "REC-123",
    receiptNumber: "REC-123",
    date: "2023-10-27",
    customer: { name: "John Doe" },
    branding: mockBranding,
    items: [
      {
        id: "item-1",
        description: "Test Product",
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100,
      },
    ],
    subtotal: 100,
    tax: 0,
    total: 100,
    paymentMethod: "M-PESA",
  };

  it("should apply branding to InvoiceTemplate", () => {
    const { getAllByText } = render(<InvoiceTemplate data={mockInvoiceData} />);

    expect(getAllByText("Acme Corp Custom").length).toBeGreaterThan(0);
    expect(getAllByText("123 Custom St, Design City").length).toBeGreaterThan(0);
  });

  it("should apply branding to ReceiptTemplate", () => {
    const { getAllByText } = render(<ReceiptTemplate data={mockReceiptData} />);

    expect(getAllByText("Acme Corp Custom").length).toBeGreaterThan(0);
    expect(getAllByText("123 Custom St, Design City").length).toBeGreaterThan(0);
  });

  it("should handle missing branding gracefully", () => {
    const dataWithoutBranding = { ...mockInvoiceData, branding: undefined };
    const { queryByText } = render(
      <InvoiceTemplate data={dataWithoutBranding} />,
    );

    // Should not crash and should show some default or be empty
    expect(queryByText("Acme Corp Custom")).toBeNull();
  });
});
