import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserSettings } from "@/app/actions/settings";

export default async function OnboardingCheckPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/login");

  const alreadyComplete =
    (sessionClaims?.publicMetadata as Record<string, unknown>)?.onboardingComplete === true;
  if (alreadyComplete) redirect("/");

  // Returning user whose metadata isn't set yet — check DB
  const settings = await getUserSettings();
  if (settings) {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: { onboardingComplete: true },
    });
    redirect("/");
  }

  // New user
  redirect("/onboarding");
}
