import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { cn } from "@/lib/utils";

import { APP_DESCRIPTION, APP_NAME } from "@/constants";
import Providers from "@/lib/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full scroll-smooth antialiased", inter.variable)}
    >
      <body className="flex min-h-full flex-col transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
