import React from "react";
import TemplateFour from "../invoice/four";
import { V3DocumentData } from "../types";

export const ReceiptFour = (props: { data: V3DocumentData; qrCode?: string }) => {
  return <TemplateFour {...props} data={{ ...props.data, type: "receipt" }} />;
};

export default ReceiptFour;
