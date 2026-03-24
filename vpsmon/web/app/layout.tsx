import type { Metadata } from "next";
import "./globals.css";
import { IntervalsProvider } from "@/providers/IntervalsProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "VPS Monitor",
  description: "VPS Health Dashboard web frontend scaffold.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <ThemeProvider>
          <IntervalsProvider>
            <QueryProvider>{children}</QueryProvider>
          </IntervalsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
