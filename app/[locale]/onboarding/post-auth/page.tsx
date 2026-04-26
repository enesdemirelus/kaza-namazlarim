import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserSettings } from "@/app/actions/settings";

export default async function PostAuthPage() {
  const { userId } = await auth();
  if (!userId) redirect("/onboarding");

  const settings = await getUserSettings();
  if (settings) redirect("/");

  redirect("/onboarding/setup");
}
