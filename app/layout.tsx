import type { Metadata, Viewport } from "next";
import { DM_Sans, Pixelify_Sans } from "next/font/google";
import "./globals.css";

const body = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const pixel = Pixelify_Sans({ subsets: ["latin"], variable: "--font-pixel" });

export const metadata: Metadata = {
  title: "Show Up",
  description: "Get matched with someone on a similar health goal, and check in together once a day.",
};

export const viewport: Viewport = {
  themeColor: "#f5f2fb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${pixel.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
