import type { Metadata } from "next";
import "@fontsource-variable/inter/index.css";
import "@fontsource-variable/source-serif-4/index.css";
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
