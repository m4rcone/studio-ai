"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/studio-ai" },
  { label: "Chat", href: "/studio-ai/chat" },
  { label: "History", href: "/studio-ai/history" },
] as const;

export function StudioNav() {
  const pathname = usePathname();

  return (
    <nav className="border-muted bg-background flex items-center gap-1 border-b px-4 md:px-6">
      {NAV_ITEMS.map(({ label, href }) => {
        // Exact match for dashboard, prefix match for sub-pages
        const isActive =
          href === "/studio-ai" ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              isActive
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            {label}
          </Link>
        );
      })}

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground ml-auto border-b-2 border-transparent px-3 py-2.5 text-xs font-medium transition-colors"
      >
        View Live Site ↗
      </a>
    </nav>
  );
}
