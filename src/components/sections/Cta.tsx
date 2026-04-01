import Link from "next/link";

/** CTA button for the Cta section. Note: this section has a primary background, so "primary" is the highest-contrast style (foreground color on primary background). */
export interface CtaButton {
  /** Button text. Max ~40 characters. */
  label: string;
  /** Destination URL. Can be an internal path (/contact) or an external URL (https://wa.me/...). */
  href: string;
  /** Visual button style. Defaults to "primary" (primary-foreground background on bg-primary). */
  style?: "primary" | "secondary" | "whatsapp";
}

export interface CtaProps {
  /** Main headline of the conversion banner. Recommended maximum 80 characters. */
  headline: string;
  /** Optional supporting text displayed below the headline. Recommended maximum 200 characters. */
  text?: string;
  /** Call-to-action button. */
  cta: CtaButton;
}

// Button styles specific to sections with a primary background.
// "primary" is inverted (primary-foreground/primary) for adequate contrast.
// For buttons on neutral backgrounds, use BUTTON_STYLES from @/lib/button-styles.
const ctaBtnClass: Record<NonNullable<CtaButton["style"]>, string> = {
  primary: "bg-primary-foreground text-primary hover:opacity-90",
  secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
  whatsapp: "bg-[#25D366] text-white hover:opacity-90",
};

export function Cta({ headline, text, cta }: CtaProps) {
  const btn = ctaBtnClass[cta.style ?? "primary"];

  return (
    <section className="bg-primary py-16 lg:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-primary-foreground text-3xl font-bold tracking-tight lg:text-4xl">
          {headline}
        </h2>
        {text && (
          <p className="text-primary-foreground/80 mt-4 text-lg">{text}</p>
        )}
        <div className="mt-8">
          <Link
            href={cta.href}
            className={`inline-block rounded-(--radius) px-8 py-3 text-base font-semibold transition-opacity ${btn}`}
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
