import Link from "next/link";
import type { SiteConfig, Navigation } from "@/lib/content";

interface FooterProps {
  brand: SiteConfig["brand"];
  contact: SiteConfig["contact"];
  social: SiteConfig["social"];
  nav: Navigation["footer"];
}

export function Footer({ brand, contact, social, nav }: FooterProps) {
  return (
    <footer className="border-foreground/10 bg-muted border-t">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <p className="font-heading text-foreground font-semibold">
              {brand.name}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {brand.tagline}
            </p>
          </div>

          {/* Contact */}
          <div>
            <p className="text-foreground text-sm font-medium">
              {nav.contactLabel}
            </p>
            <ul className="mt-2 space-y-1">
              <li>
                <a
                  href={`tel:${contact.phone}`}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  {contact.email}
                </a>
              </li>
              <li className="text-muted-foreground text-sm">
                {contact.address.street}, {contact.address.neighborhood}
                {" — "}
                {contact.address.city}/{contact.address.state}
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <p className="text-foreground text-sm font-medium">
              {nav.socialLabel}
            </p>
            <ul className="mt-2 space-y-1">
              {social.instagram && (
                <li>
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    Instagram
                  </a>
                </li>
              )}
              {social.facebook && (
                <li>
                  <a
                    href={social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    Facebook
                  </a>
                </li>
              )}
              {social.linkedin && (
                <li>
                  <a
                    href={social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground text-sm"
                  >
                    LinkedIn
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-foreground/10 mt-8 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-muted-foreground text-xs">{nav.copyright}</p>
          <ul className="flex gap-4">
            {nav.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
