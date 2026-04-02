import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSiteConfig } from "@/lib/content";
import { verifyToken, COOKIE_NAME } from "@/lib/studio/auth";
import { StudioTopBar } from "@/components/studio/StudioTopBar";
import { StudioNav } from "@/components/studio/StudioNav";

export const metadata: Metadata = {
  robots: "noindex, nofollow",
  title: "Studio AI",
};

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, cookieStore] = await Promise.all([getSiteConfig(), cookies()]);

  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  return (
    <div className="bg-muted/40 flex min-h-screen flex-col">
      <StudioTopBar
        brandName={config.brand.name}
        brandLogo={config.brand.logo}
        username={user?.username ?? null}
      />
      <StudioNav />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
