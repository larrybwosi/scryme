import React from "react";
import TemplateEight from "../invoice/eight";
import { V3DocumentData } from "../types";

export const ReceiptEight = (props: { data: V3DocumentData; qrCode?: string }) => {
  return <TemplateEight {...props} data={{ ...props.data, type: "receipt" }} />;
};

export default ReceiptEight;
