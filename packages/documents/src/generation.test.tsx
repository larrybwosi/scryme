import { describe, it, expect, vi } from "vitest";
import React from "react";
import { InvoiceTemplate, DocumentGenerator } from "./index";

// Mock @react-pdf/renderer
vi.mock("@react-pdf/renderer", async () => {
  const actual = await vi.importActual("@react-pdf/renderer");
  return {
    ...actual,
    renderToBuffer: vi.fn().mockResolvedValue(Buffer.from("pdf-buffer")),
    renderToStream: vi.fn().mockResolvedValue({ pipe: vi.fn() }),
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

describe("Document Generation Logic", () => {
  const mockData: any = {
    id: "inv-1",
    number: "INV-001",
    invoiceNumber: "INV-001",
    date: "2023-10-27",
    customerName: "Jane Doe",
    customerAddress: "456 Avenue, Tech City",
    branding: {
      companyName: "Scryme Test",
    },
    items: [
      {
        id: "item-1",
        description: "Service A",
        quantity: 1,
        unitPrice: 200,
        totalPrice: 200,
      },
    ],
    subtotal: 200,
    tax: 0,
    total: 200,
  };

  it("should generate a React element for InvoiceTemplate", () => {
    const element = <InvoiceTemplate data={mockData} />;
    expect(element).toBeDefined();
    expect(element.type).toBe(InvoiceTemplate);
  });

  it("should expose DocumentGenerator helpers", () => {
    expect(DocumentGenerator.toBuffer).toBeDefined();
    expect(DocumentGenerator.toStream).toBeDefined();
  });
});
