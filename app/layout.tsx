import type { Metadata, Viewport } from "next";
import { PhoneFrame } from "@/components/PhoneFrame";
import { APPLY_BEFORE_PAINT } from "@/lib/reading";
import "./globals.css";

export const metadata: Metadata = {
  title: "Promise Pals",
  description: "Promise Pals pairs Calgarians who struggle to stick to their health goals with a nearby partner, and proves every check-in with a photo or their Fitbit. Built for people step counters leave out.",
  appleWebApp: { capable: true, title: "Promise Pals", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#ffd54f",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPLY_BEFORE_PAINT }} />
      </head>
      <body>
        <PhoneFrame>{children}</PhoneFrame>
      </body>
    </html>
  );
}
