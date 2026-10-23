import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArabEasy — Belajar Bahasa Arab",
  description: "Platform pembelajaran Bahasa Arab interaktif untuk pelajar dan mahasiswa.",
  applicationName: "ArabEasy"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
