import Link from "next/link";
import { cookies } from "next/headers";
import { getSiteConfig, getAllPages } from "@/lib/content";
import { verifyToken, COOKIE_NAME } from "@/lib/studio/auth";
import { StudioCard } from "@/components/studio/StudioCard";
import { SessionBanner } from "@/components/studio/SessionBanner";

export default async function DashboardPage() {
  const [config, pages, cookieStore] = await Promise.all([
    getSiteConfig(),
    getAllPages(),
    cookies(),
  ]);

  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;
  const pageCount = pages.length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-foreground text-2xl">
          {user ? `Welcome, ${user.username}` : "Dashboard"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {user?.role === "team"
            ? "Full editing access."
            : "Content editing access."}
        </p>
      </div>

      {/* Active session banner */}
      <SessionBanner />

      {/* Site summary */}
      <StudioCard>
        <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
          Site
        </h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-foreground text-lg">
              {config.brand.name}
            </span>
            <span className="text-muted-foreground text-xs">
              {config.brand.tagline}
            </span>
          </div>
          <div className="mt-1 flex gap-4">
            <Stat label="Pages" value={String(pageCount)} />
            <Stat label="User" value={user?.username ?? "—"} />
          </div>
        </div>
      </StudioCard>

      {/* Quick actions */}
      <div>
        <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ActionCard
            href="/studio-ai/chat"
            title="Open Chat"
            description="Edit content with AI assistance"
            primary
          />
          <ActionCard
            href="/studio-ai/history"
            title="Edit History"
            description="Browse past edit sessions"
          />
          <ActionCard
            href="/"
            title="View Live Site"
            description="Open the public site"
            external
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-foreground text-sm font-medium capitalize">
        {value}
      </span>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
  primary = false,
  external = false,
}: {
  href: string;
  title: string;
  description: string;
  primary?: boolean;
  external?: boolean;
}) {
  const base =
    "group flex flex-col gap-1 p-4 rounded-[var(--radius)] border transition-colors cursor-pointer";
  const variant = primary
    ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
    : "bg-background border-muted hover:border-foreground/30 text-foreground";

  const props = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link href={href} className={`${base} ${variant}`} {...props}>
      <span className="text-sm font-medium">{title}</span>
      <span
        className={`text-xs ${primary ? "text-primary-foreground/70" : "text-muted-foreground"}`}
      >
        {description}
      </span>
    </Link>
  );
}
