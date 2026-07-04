import React from "react";
import TemplateSeven from "../invoice/seven";
import { V3DocumentData } from "../types";

export const ReceiptSeven = (props: { data: V3DocumentData; qrCode?: string }) => {
  return <TemplateSeven {...props} data={{ ...props.data, type: "receipt" }} />;
};

export default ReceiptSeven;
