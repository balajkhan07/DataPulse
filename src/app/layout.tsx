import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataPulse · Story Studio",
  description: "Turn structured data into animated visual stories.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
