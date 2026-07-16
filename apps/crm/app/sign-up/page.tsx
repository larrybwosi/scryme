import { Metadata } from "next";
import SignupPage from "./signup-client";

export const metadata: Metadata = {
  title: "Create an Account",
  description:
    "Create an enterprise CRM account with Scryme to collaborate with vetted agencies and streamline your client pipeline.",
  alternates: {
    canonical: "/sign-up",
  },
};

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface PageProps {
  params: Params;
  searchParams: SearchParams;
}

export default function Page({ params, searchParams }: PageProps) {
  return <SignupPage params={params} searchParams={searchParams} />;
}
