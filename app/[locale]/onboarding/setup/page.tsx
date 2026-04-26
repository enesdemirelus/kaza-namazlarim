import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SetupFlow from "@/app/components/SetupFlow";

export default async function SetupPage() {
  const { userId } = await auth();
  if (!userId) redirect("/onboarding");

  return <SetupFlow />;
}
