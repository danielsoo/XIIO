import { redirect } from "next/navigation";

export default function DiscoverRedirectPage() {
  redirect("/account?tab=discover");
}
