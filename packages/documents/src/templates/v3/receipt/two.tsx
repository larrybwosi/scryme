import React from "react";
import TemplateTwo from "../invoice/two";
import { V3DocumentData } from "../types";

export const ReceiptTwo = (props: { data: V3DocumentData; qrCode?: string }) => {
  return <TemplateTwo {...props} data={{ ...props.data, type: "receipt" }} />;
};

export default ReceiptTwo;
