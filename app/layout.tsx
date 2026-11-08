import type { Metadata, Viewport } from "next";
import { Press_Start_2P } from "next/font/google";
import { PhoneFrame } from "@/components/PhoneFrame";
import "./globals.css";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-pixel" });

export const metadata: Metadata = {
  title: "Promise Pals",
  description: "Promise Pals pairs Calgarians doing physio at home with a nearby partner, and proves every check-in with a photo or their Fitbit. Built for people step counters leave out.",
  appleWebApp: { capable: true, title: "Promise Pals", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#ffd54f",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixel.variable} h-full antialiased`}>
      <body>
        <PhoneFrame>{children}</PhoneFrame>
      </body>
    </html>
  );
}
