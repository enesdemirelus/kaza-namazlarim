import { SignIn } from "@clerk/nextjs";
import { MoonStar } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function SignInPage() {
  const tNav = await getTranslations("nav");

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-6 p-4">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <MoonStar className="w-7 h-7 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{tNav("title")}</h1>
      </header>

      <div className="w-full max-w-sm">
        <SignIn
          appearance={{
            elements: {
              header: "!hidden",
              rootBox: "w-full",
              cardBox: "w-full",
            },
          }}
        />
      </div>
    </main>
  );
}
