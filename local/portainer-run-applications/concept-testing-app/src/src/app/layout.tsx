import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import { Suspense } from "react";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Help us shape Portainer's Experience";
const description =
  "Try Portainer V3 early and tell us what you really think. It takes 15–30 minutes, saves as you go, and every finisher gets a free Portainer t-shirt and swag pack.";

// Link previews (Slack, LinkedIn, X, iMessage…) use these. The share image is opengraph-image.png / twitter-image.png.
export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(await siteUrl()),
    title,
    description,
    applicationName: "Portainer V3 Concept Test",
    keywords: [
      "Portainer",
      "Portainer V3",
      "user research",
      "concept test",
      "Kubernetes",
      "Docker",
      "free swag",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      siteName: "Portainer",
      title,
      description,
      locale: "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// The metadata above reads the request's domain. This empty marker tells Next.js that's intended, so the rest of each page still prerenders.
async function RequestTime() {
  await connection();
  return null;
}

export const viewport: Viewport = { themeColor: "#0b8fd6" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Browser extensions (e.g. ColorZilla) add attributes to <body> before React loads. */}
      <body className="min-h-full" suppressHydrationWarning>
        {children}
        <Suspense>
          <RequestTime />
        </Suspense>
      </body>
    </html>
  );
}
