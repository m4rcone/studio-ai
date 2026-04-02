"use client";

import { useRouter } from "next/navigation";

interface StudioTopBarProps {
  brandName: string;
  brandLogo: string | null;
  username: string | null;
}

export function StudioTopBar({ brandName, username }: StudioTopBarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/studio/auth/logout", { method: "POST" });
    router.push("/studio-ai/login");
    router.refresh();
  }

  return (
    <header className="bg-primary text-primary-foreground flex h-14 shrink-0 items-center px-4 md:px-6">
      {/* Left: brand + studio label */}
      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate text-sm font-semibold">{brandName}</span>
        <span className="text-primary-foreground/40 hidden select-none sm:inline">
          ·
        </span>
        <span className="text-primary-foreground/70 hidden text-xs font-medium tracking-wide uppercase sm:inline">
          Studio AI
        </span>
      </div>

      {/* Right: user + logout */}
      {username && (
        <div className="ml-auto flex items-center gap-3">
          <span className="text-primary-foreground/70 hidden max-w-48 truncate text-xs sm:block">
            {username}
          </span>
          <button
            onClick={handleLogout}
            className="text-primary-foreground/70 hover:text-primary-foreground border-primary-foreground/20 hover:border-primary-foreground/50 cursor-pointer rounded-[var(--radius)] border px-3 py-1.5 text-xs transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
