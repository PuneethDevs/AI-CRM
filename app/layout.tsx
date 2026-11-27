import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoXUSA | USA AI Voice CRM",
  description: "VoXUSA Autonomous AI Voice Calling CRM powered by Riya",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F8F9FA] text-[#101828] antialiased selection:bg-[#F95724] selection:text-white">
        {children}
      </body>
    </html>
  );
}
