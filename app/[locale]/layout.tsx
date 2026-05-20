import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ClerkProvider } from "@clerk/nextjs";
import { enUS, trTR } from "@clerk/localizations";
import { auth } from "@clerk/nextjs/server";
import { getUserSettings } from "@/app/actions/settings";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://kazanamazlarim.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const isTr = locale === "tr";

  const title = isTr ? "Kaza Namazlarım" : "Qada Prayers";
  const description = isTr
    ? "Kaza namazlarınızı gün gün takip edin ve tamamlayın. Namaz vakitleri, istatistikler ve daha fazlası."
    : "Track and make up your missed qada prayers, one day at a time. Prayer times, statistics, and more.";

  const canonical = `${SITE_URL}/${locale}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    alternates: {
      canonical,
      languages: {
        tr: `${SITE_URL}/tr`,
        en: `${SITE_URL}/en`,
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: isTr ? "Kaza Namazlarım" : "Qada Prayers",
      title,
      description,
      locale: isTr ? "tr_TR" : "en_US",
      alternateLocale: isTr ? "en_US" : "tr_TR",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  const localization = locale === "tr" ? trTR : enUS;

  // Server-side: fetch the authenticated user's accent color from DB so the
  // initial HTML has the correct data-color attribute. No flash, no localStorage
  // dependency, persists across devices via the database.
  const { userId } = await auth();
  let accentColor = "green";
  if (userId) {
    try {
      const settings = await getUserSettings();
      if (settings?.accentColor) {
        accentColor = settings.accentColor;
      }
    } catch {
      // Fall back to green on DB error
    }
  }

  return (
    <ClerkProvider localization={localization}>
      <html
        lang={locale}
        data-color={accentColor}
        suppressHydrationWarning
        className={cn(
          "min-h-dvh",
          "antialiased",
          geistSans.variable,
          geistMono.variable,
          "font-sans",
          outfit.variable,
        )}
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem("theme")||"light";if(t==="system"){t=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}document.documentElement.classList.remove("light","dark");document.documentElement.classList.add(t)}catch(e){}})();`,
            }}
          />
        </head>
        <body className="min-h-dvh flex flex-col">
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableColorScheme={false}
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
