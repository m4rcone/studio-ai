// ─── Section type re-exports ───────────────────────────────────────────────────
// Each section's types live alongside the component that consumes them.
// They are centralized here for convenient imports and to compose SectionData.

export type { HeroProps, HeroCta, HeroImage } from "@/components/sections/Hero";
export type {
  FeaturesProps,
  FeaturesItem,
} from "@/components/sections/Features";
export type { CtaProps, CtaButton } from "@/components/sections/Cta";

import type { HeroProps } from "@/components/sections/Hero";
import type { FeaturesProps } from "@/components/sections/Features";
import type { CtaProps } from "@/components/sections/Cta";

/**
 * Union of all available section data types.
 * Add new types here when creating new section components.
 */
export type SectionData = HeroProps | FeaturesProps | CtaProps;

// ─── Shared interfaces ─────────────────────────────────────────────────────────

/** A single section entry in a page JSON file. */
export interface SectionEntry {
  /** Section type — determines which component renders it. Must match a key in the section registry. */
  type: string;
  /** Unique identifier for the section within the page. Kebab-case descriptive format. E.g. "main-hero", "featured-services". */
  id: string;
  /** Data passed as props to the section component. Must match the interface of the corresponding component. */
  data: Record<string, unknown>;
}

/** SEO metadata for a page. */
export interface PageMeta {
  /** Page title for the <title> tag and search engines. Recommended maximum 70 characters. */
  title: string;
  /** Page description for search engines. Recommended 150–160 characters, maximum 200. */
  description: string;
}

/** Structure of a [slug].data.json file. */
export interface PageData {
  /** Page identifier used in the URL. "home" renders at /. Kebab-case format. */
  slug: string;
  /** SEO metadata for the page. */
  meta: PageMeta;
  /** Ordered array of sections. The order defines the render order on the page. */
  sections: SectionEntry[];
}

/** A simple navigation link. */
export interface NavigationLink {
  /** Text displayed in the menu. */
  label: string;
  /** Destination URL. Can be an internal path (/) or an external URL. */
  href: string;
}

/** A highlighted navigation button with a visual style. */
export interface NavigationCta extends NavigationLink {
  /** Visual style of the CTA button in the header. */
  style: "primary" | "secondary";
}

/** Structure of content/navigation.json */
export interface Navigation {
  /** Main navigation menu at the top of the site. */
  header: {
    /** Navigation menu links. */
    links: NavigationLink[];
    /** Highlighted button in the header. E.g. "Get in touch". */
    cta: NavigationCta;
  };
  /** Site footer configuration. */
  footer: {
    /** Institutional/legal links in the footer. E.g. Privacy Policy, Terms of Use. */
    links: NavigationLink[];
    /** Copyright text displayed in the footer. E.g. "© 2025 Company. All rights reserved." */
    copyright: string;
    /** Label for the contact section in the footer. E.g. "Contact". */
    contactLabel: string;
    /** Label for the social media section in the footer. E.g. "Follow us". */
    socialLabel: string;
  };
}

/** Structure of content/site.config.json */
export interface SiteConfig {
  /** Brand identity. */
  brand: {
    /** Company or business name. */
    name: string;
    /** Brand slogan or tagline. */
    tagline: string;
    /** Logo path under /media/. Preferred format: .svg. */
    logo: string;
  };
  /** Design tokens consumed by Tailwind via generate-theme. Edit here, not in theme.generated.css. */
  theme: {
    colors: {
      /** Main brand color. Hex format. E.g. "#2563eb". */
      primary: string;
      /** Text/icon color on primary background. Hex format. */
      "primary-foreground": string;
      /** Accent or secondary brand color. Hex format. */
      secondary: string;
      /** Text/icon color on secondary background. Hex format. */
      "secondary-foreground": string;
      /** General site background color. Hex format. */
      background: string;
      /** General site text color. Hex format. */
      foreground: string;
      /** Subtle background color for alternating sections and cards. Hex format. */
      muted: string;
      /** Secondary text color on muted background. Hex format. */
      "muted-foreground": string;
    };
    fonts: {
      /** Font for headings (h1–h4). Must be available via Google Fonts or be a system font. */
      heading: string;
      /** Font for body text (p, li, etc.). */
      body: string;
    };
    /** Default border radius for elements. E.g. "0.5rem", "0.25rem". */
    borderRadius: string;
  };
  /** Business contact information. */
  contact: {
    /** Phone number formatted for display. E.g. "(41) 9999-8888". */
    phone: string;
    /** WhatsApp number without formatting, including country code. E.g. "5541999998888". */
    whatsapp: string;
    /** Contact email address. */
    email: string;
    address: {
      /** Street and number. E.g. "123 Main Street". */
      street: string;
      /** Neighborhood or district. */
      neighborhood: string;
      /** City. */
      city: string;
      /** State abbreviation. E.g. "CA", "NY". */
      state: string;
      /** Postal/ZIP code. */
      zip: string;
    };
  };
  /** Social media links. Use null to hide the icon. */
  social: {
    instagram: string | null;
    facebook: string | null;
    linkedin: string | null;
  };
  /** Default SEO settings, used when a page does not define its own. */
  seo: {
    /** Default title used when a page does not define its own. */
    defaultTitle: string;
    /** Title template. %s is replaced by the page title. E.g. "%s | Company". */
    titleTemplate: string;
    /** Default description for search engines. Recommended 150–160 characters. */
    defaultDescription: string;
  };
}

/** A single image entry in the media manifest. */
export interface MediaManifestEntry {
  /** Image path under /media/. E.g. "/media/hero.webp". */
  src: string;
  /** Accessible description of the image. */
  alt: string;
  /** Original image width in pixels. */
  width: number;
  /** Original image height in pixels. */
  height: number;
  /** List of content files that reference this image. */
  usedIn: string[];
}

/** Structure of content/media/manifest.json */
export interface MediaManifest {
  /** Registry of all images used on the site. */
  images: MediaManifestEntry[];
}
