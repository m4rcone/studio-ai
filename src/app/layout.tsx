import "./globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

export const metadata: Metadata = {
  title: "Hello World",
  description: "This is a simple Next.js application.",
};

const geist = Geist({
  subsets: ["latin"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={geist.className}>
      <body className="bg-stone-50">{children}</body>
    </html>
  );
}
