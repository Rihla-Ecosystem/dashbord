// "use client";

import type { Metadata } from "next";

import "./globals.css";
import { cn } from "@/lib/utils";

import { APP_DESCRIPTION, APP_NAME } from "@/constants";
import Providers from "@/lib/providers";



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
      className={cn(
        "h-full scroll-smooth",
        "antialiased",
    
      )}
    >
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <Providers>

          {children}
        </Providers>
      </body>
    </html>
  );
}
