import { Button } from "@/components/ui/Button";

export interface CtaProps {
  /** Main headline. Recommended max 80 characters. */
  headline: string;
  /** Optional supporting text. Recommended max 200 characters. */
  text?: string;
  /** Call-to-action button. */
  cta: {
    /** Button label. Max ~30 characters. */
    label: string;
    /** Destination URL. */
    href: string;
    /** Visual style. */
    style?: "primary" | "secondary" | "whatsapp" | "outline";
  };
}

export function Cta({ headline, text, cta }: CtaProps) {
  return (
    <section className="bg-primary px-6 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <div className="bg-secondary mx-auto mb-8 h-px w-12" />
        <h2 className="text-primary-foreground mb-6 font-[family-name:var(--font-heading)] text-3xl sm:text-4xl xl:text-5xl">
          {headline}
        </h2>
        {text && (
          <p className="text-primary-foreground/60 mx-auto mb-10 max-w-xl leading-relaxed">
            {text}
          </p>
        )}
        <Button
          label={cta.label}
          href={cta.href}
          style={cta.style ?? "secondary"}
        />
      </div>
    </section>
  );
}
