import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSiteConfig, getNavigation } from "@/lib/content";

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return {
    title: {
      default: config.seo.defaultTitle,
      template: config.seo.titleTemplate,
    },
    description: config.seo.defaultDescription,
    other: {
      "theme-color": config.theme.colors.background,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, nav] = await Promise.all([getSiteConfig(), getNavigation()]);

  return (
    <html
      lang="pt-BR"
      className={`${dmSerifDisplay.variable} ${inter.variable}`}
    >
      <body className="bg-background text-foreground flex min-h-screen flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-background focus:text-foreground focus:rounded focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg"
        >
          Skip to main content
        </a>
        <Header config={config} nav={nav} />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer config={config} nav={nav} />
      </body>
    </html>
  );
}
