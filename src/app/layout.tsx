import type { Metadata } from "next";
import MetaPixel from "@/components/MetaPixel";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://quizbowl-site.vercel.app"),
  title: "quizbowl — know it first",
  description:
    "The daily training app for quizbowl. Questions read at real match pace — build buzzer speed and depth of knowledge, because knowing isn't enough. You have to know it first.",
  openGraph: {
    title: "quizbowl — know it first",
    description:
      "Daily buzzer training at real match pace. Get early access.",
    siteName: "quizbowl",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
