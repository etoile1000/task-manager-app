import type { Metadata } from "next";
import { ServiceWorkerUnregister } from "@/components/service-worker-unregister";
import { SplashScreen } from "@/components/splash-screen";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doova",
  description: "Do something. Reach nova.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css"
        />
      </head>
      <body>
        <SplashScreen />
        <ServiceWorkerUnregister />
        {children}
      </body>
    </html>
  );
}
