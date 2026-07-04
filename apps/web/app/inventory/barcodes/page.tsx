import { BarcodeRegistrationClient } from "./barcode-registration-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Barcode Registration | Scryme ERP",
  description: "Register and manage barcodes for your inventory products.",
};

export default function BarcodeRegistrationPage() {
  return (
    <div className="container py-10">
      <BarcodeRegistrationClient />
    </div>
  );
}
