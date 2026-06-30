import React from "react";
import TemplateThree from "../invoice/three";
import { V3DocumentData } from "../types";

export const ReceiptThree = (props: { data: V3DocumentData; qrCode?: string }) => {
  return <TemplateThree {...props} data={{ ...props.data, type: "receipt" }} />;
};

export default ReceiptThree;
