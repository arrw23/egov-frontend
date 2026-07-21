import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GabayMed | Medical Assistance System",
  description: "Unified Philippine eGov digital medical guarantee letter platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-PH" className="h-full antialiased">
      <head>
        <script src="https://hackathon-everify-face-liveness.e.gov.ph/js/everify-liveness-sdk.min.js" async></script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
