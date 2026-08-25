import { Metadata } from "next";
import LoginPage from "./login-client";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to the Scryme platform administration console.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <LoginPage />;
}
