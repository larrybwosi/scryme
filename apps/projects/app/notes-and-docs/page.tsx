import { redirect } from "next/navigation";

export default function NotesAndDocsRedirectPage() {
  redirect("/projects?choose=1");
}
