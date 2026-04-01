import Image from "next/image";
import Link from "next/link";
import { BUTTON_STYLES } from "@/lib/button-styles";

/** CTA button for the Hero section. */
export interface HeroCta {
  /** Button text. E.g. "Get in touch", "Learn more". Max ~30 characters. */
  label: string;
  /** Destination URL. Can be an internal path (/contact) or an external URL (https://wa.me/...). */
  href: string;
  /** Visual button style. Defaults to "primary". */
  style?: "primary" | "secondary" | "whatsapp";
}

/** Featured image for the Hero section. */
export interface HeroImage {
  /** Image path under /media/. Preferred formats: .webp for photos, .svg for icons. Must start with /media/. */
  src: string;
  /** Accessible image description. Required for SEO and accessibility. Max ~120 characters. */
  alt: string;
}

export interface HeroProps {
  /** Main headline displayed prominently at the top of the page. Recommended maximum 80 characters. */
  headline: string;
  /** Supporting text displayed below the headline. Recommended maximum 200 characters. */
  subheadline?: string;
  /** Call-to-action button. */
  cta: HeroCta;
  /** Featured image displayed beside the text in a two-column layout. */
  image: HeroImage;
}

export function Hero({ headline, subheadline, cta, image }: HeroProps) {
  const btnClass = BUTTON_STYLES[cta.style ?? "primary"];

  return (
    <section className="bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
        {/* Text */}
        <div className="flex flex-col gap-6">
          <h1 className="text-foreground text-4xl leading-tight font-bold tracking-tight lg:text-5xl xl:text-6xl">
            {headline}
          </h1>
          {subheadline && (
            <p className="text-muted-foreground max-w-lg text-lg leading-relaxed">
              {subheadline}
            </p>
          )}
          <div>
            <Link
              href={cta.href}
              className={`inline-block rounded-(--radius) px-8 py-3 text-base font-semibold transition-opacity ${btnClass}`}
            >
              {cta.label}
            </Link>
          </div>
        </div>

        {/* Image */}
        <div className="bg-muted relative aspect-4/3 w-full overflow-hidden rounded-(--radius) shadow-lg">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            unoptimized
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}
