import { redirect } from "next/navigation";

export default function AccountProfileEditRedirectPage() {
  redirect("/account?tab=profile");
}
