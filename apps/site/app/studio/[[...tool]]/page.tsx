"use client";

import { NextStudio } from "next-sanity/studio";
import config from "../../../sanity.config";

export const dynamic = "force-dynamic";

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-black">
      <NextStudio config={config} />
    </div>
  );
}
