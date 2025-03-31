import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SDS8XX Bode Plotter",
  description:
    "A Bode plotter for the SDS8XX series of oscilloscopes using external AWG",

  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
