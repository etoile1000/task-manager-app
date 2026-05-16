import type { Metadata } from "next";
import { ServiceWorkerUnregister } from "@/components/service-worker-unregister";
import { SplashScreen } from "@/components/splash-screen";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doova",
  description: "「やること」が、星になる。優先度×期限で自動ソートするタスク管理アプリ。",
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
  openGraph: {
    title: "Doova — Do something. Reach nova.",
    description:
      "「やること」が、星になる。優先度×期限で自動ソート、背景・テーマを自分好みにカスタマイズできるタスク管理アプリ。",
    url: "https://tasks.etoilellc.com",
    siteName: "Doova",
    images: [
      {
        url: "https://tasks.etoilellc.com/ogp.png",
        width: 1200,
        height: 630,
        alt: "Doova — Do something. Reach nova.",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Doova — Do something. Reach nova.",
    description:
      "「やること」が、星になる。優先度×期限で自動ソート、背景・テーマを自分好みにカスタマイズできるタスク管理アプリ。",
    images: ["https://tasks.etoilellc.com/ogp.png"],
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
