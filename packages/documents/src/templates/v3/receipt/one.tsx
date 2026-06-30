import React from "react";
import TemplateOne from "../invoice/one";
import { V3DocumentData } from "../types";

export const ReceiptOne = (props: { data: V3DocumentData; qrCode?: string }) => {
  return <TemplateOne {...props} data={{ ...props.data, type: "receipt" }} />;
};

export default ReceiptOne;
