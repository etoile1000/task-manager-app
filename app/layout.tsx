import type { Metadata } from "next";
import { ServiceWorkerUnregister } from "@/components/service-worker-unregister";
import { SplashScreen } from "@/components/splash-screen";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doova",
  description: "Do something. Reach nova.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
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
