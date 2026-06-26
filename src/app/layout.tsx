import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Leaflet CSS must be loaded globally — client-component imports fail in Turbopack
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { Providers } from "@/components/providers";
import { OutsideThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/pwa-register";
import { AppContainer } from "@/components/app-container";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OUTSIDE — Le monde est dehors",
  description:
    "Trouve quoi faire autour de toi. Plans, lieux et gens près de toi. Maintenant.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-dark.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OUTSIDE",
  },
  applicationName: "OUTSIDE",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [{ color: "#fafafa" }],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://*.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://*.supabase.co" />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <PwaRegister />
        <Providers>
          <OutsideThemeProvider>
            <AppContainer>{children}</AppContainer>
          </OutsideThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
