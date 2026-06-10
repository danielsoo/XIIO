import { redirect } from "next/navigation";

export default function CreatorsRedirectPage() {
  redirect("/society?tab=discover");
}
