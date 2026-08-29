import { Metadata } from "next";
import React from "react";
import {
  getSystemUnits,
  getOrganizationUnits,
  getOrgUnitConversions,
} from "../../actions/units";
import { UnitsPageContent } from "./units-content";

export const metadata: Metadata = {
  title: "Units of Measure",
  description: "Define custom unit conversions, packaging standards, and measurement types.",
};


export default async function UnitsPage() {
  const [systemUnits, orgUnits, conversions] = await Promise.all([
    getSystemUnits(),
    getOrganizationUnits(),
    getOrgUnitConversions(),
  ]);

  return (
    <UnitsPageContent
      systemUnits={systemUnits}
      orgUnits={orgUnits}
      conversions={conversions}
    />
  );
}
