import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getSiteConfig, getNavigation } from "@/lib/content";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return {
    title: {
      template: config.seo.titleTemplate,
      default: config.seo.defaultTitle,
    },
    description: config.seo.defaultDescription,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, nav] = await Promise.all([getSiteConfig(), getNavigation()]);

  return (
    <html lang="en" className={inter.className}>
      <body className="bg-background text-foreground flex min-h-screen flex-col">
        <Header brand={config.brand} nav={nav.header} />
        <main className="flex-1">{children}</main>
        <Footer
          brand={config.brand}
          contact={config.contact}
          social={config.social}
          nav={nav.footer}
        />
      </body>
    </html>
  );
}
