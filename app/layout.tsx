import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haushalt OS",
  description: "Smart Home Dashboard",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Haushalt OS",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Ermöglicht randloses Rendern unter der Dynamic Island
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="antialiased select-none">{children}</body>
    </html>
  );
}