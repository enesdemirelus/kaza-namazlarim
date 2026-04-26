import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";

const handleI18n = createIntlMiddleware(routing);

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/:locale/login(.*)",
]);

const isOnboardingRoute = createRouteMatcher([
  "/onboarding(.*)",
  "/:locale/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();
  const onboardingComplete =
    (sessionClaims?.publicMetadata as Record<string, unknown>)?.onboardingComplete === true;

  if (!userId) {
    if (!isPublicRoute(request)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } else {
    if (isPublicRoute(request)) {
      const dest = onboardingComplete ? "/" : "/onboarding";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    if (!onboardingComplete && !isOnboardingRoute(request)) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return handleI18n(request);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
