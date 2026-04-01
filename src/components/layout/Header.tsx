"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { SiteConfig, Navigation } from "@/lib/content";

interface HeaderProps {
  brand: SiteConfig["brand"];
  nav: Navigation["header"];
}

export function Header({ brand, nav }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-foreground/10 bg-background border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {brand.logo && (
            <Image
              src={brand.logo}
              alt={brand.name}
              width={160}
              height={32}
              className="h-8 w-auto"
            />
          )}
          <span className="font-heading text-foreground text-lg font-semibold">
            {brand.name}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {nav.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={nav.cta.href}
            className="bg-primary text-primary-foreground rounded-(--radius) px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          >
            {nav.cta.label}
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <span
            className={`bg-foreground block h-0.5 w-6 transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`bg-foreground block h-0.5 w-6 transition-opacity ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`bg-foreground block h-0.5 w-6 transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-foreground/10 bg-background border-t px-4 pb-4 md:hidden">
          <ul className="flex flex-col gap-4 pt-4">
            {nav.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-sm"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={nav.cta.href}
                className="bg-primary text-primary-foreground inline-block rounded-(--radius) px-4 py-2 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                {nav.cta.label}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
