import React from "react";
import TemplateSix from "../invoice/six";
import { V3DocumentData } from "../types";

export const ReceiptSix = (props: { data: V3DocumentData; qrCode?: string }) => {
  return <TemplateSix {...props} data={{ ...props.data, type: "receipt" }} />;
};

export default ReceiptSix;
