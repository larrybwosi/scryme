import { Metadata } from "next";
import ForbiddenClient from "./forbidden-client";

export const metadata: Metadata = {
  title: "403 Access Restricted",
  description: "You do not have permission to view this resource.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForbiddenPage() {
  return <ForbiddenClient />;
}
