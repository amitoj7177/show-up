import type { Metadata, Viewport } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-pixel" });

export const metadata: Metadata = {
  title: "Promise Pals",
  description: "Keep your health promises with a real partner in Calgary. Check in with a photo every day.",
  appleWebApp: { capable: true, title: "Promise Pals", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#ffd54f",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixel.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
