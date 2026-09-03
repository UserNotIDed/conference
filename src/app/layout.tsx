import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yosi — booth demo",
  description:
    "Patient intake in under 90 seconds, and what the difference is worth to your practice.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#F7F9FC",
  width: "device-width",
  initialScale: 1,
  // The flow is thumb-driven and full of tap targets; a double-tap zoom in the
  // middle of a signature is the thing that makes it feel broken.
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
