import { redirect } from "next/navigation";

export default function MilestonesRedirectPage() {
  redirect("/projects?choose=1");
}
