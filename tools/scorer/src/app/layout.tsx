import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Strange Loop Lab Local Scorer",
  description: "Local-first human scoring portal for Strange Loop Lab experiment outputs."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
