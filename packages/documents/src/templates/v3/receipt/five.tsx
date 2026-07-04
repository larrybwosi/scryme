import React from "react";
import TemplateFive from "../invoice/five";
import { V3DocumentData } from "../types";

export const ReceiptFive = (props: { data: V3DocumentData; qrCode?: string }) => {
  return <TemplateFive {...props} data={{ ...props.data, type: "receipt" }} />;
};

export default ReceiptFive;
