"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export interface ContactField {
  /** Field name/id. Used as the HTML name attribute. */
  name: string;
  /** Field label shown to user. */
  label: string;
  /** HTML input type (text, email, tel, textarea). */
  type: "text" | "email" | "tel" | "textarea";
  /** Whether the field is required. */
  required?: boolean;
}

export interface ContactSectionProps {
  /** Section heading. Max ~60 characters. */
  headline: string;
  /** Intro text. Max ~200 characters. */
  description: string;
  /** Phone display string. */
  phone: string;
  /** Email address. */
  email: string;
  /** Full address string. */
  address: string;
  /** Business hours string. Max ~100 characters. */
  hours: string;
  /** WhatsApp URL for direct contact link. */
  whatsappUrl: string;
  /** Label for WhatsApp button. */
  whatsappLabel: string;
  /** Form fields definition. */
  fields: ContactField[];
  /** Form submit button label. */
  submitLabel: string;
  /** Label shown after successful submission. */
  successMessage: string;
  /** Label for the phone info block. E.g. "Phone". */
  phoneLabel?: string;
  /** Label for the email info block. E.g. "Email". */
  emailLabel?: string;
  /** Label for the address info block. E.g. "Address". */
  addressLabel?: string;
  /** Label for the business hours info block. E.g. "Hours". */
  hoursLabel?: string;
}

export function ContactSection({
  headline,
  description,
  phone,
  email,
  address,
  hours,
  whatsappUrl,
  whatsappLabel,
  fields,
  submitLabel,
  successMessage,
  phoneLabel = "Phone",
  emailLabel = "Email",
  addressLabel = "Address",
  hoursLabel = "Hours",
}: ContactSectionProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // Silently fail for now — form will remain visible for retry
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="bg-background px-6 py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 lg:grid-cols-2">
        {/* Left: info */}
        <div>
          <div className="bg-secondary mb-6 h-px w-8" />
          <h2 className="text-foreground mb-6 font-[family-name:var(--font-heading)] text-3xl sm:text-4xl">
            {headline}
          </h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            {description}
          </p>

          <div className="space-y-6">
            <div>
              <p className="text-secondary mb-1 text-xs tracking-widest uppercase">
                {phoneLabel}
              </p>
              <a
                href={`tel:${phone}`}
                className="text-foreground hover:text-secondary focus-visible:ring-secondary transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                {phone}
              </a>
            </div>
            <div>
              <p className="text-secondary mb-1 text-xs tracking-widest uppercase">
                {emailLabel}
              </p>
              <a
                href={`mailto:${email}`}
                className="text-foreground hover:text-secondary focus-visible:ring-secondary transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                {email}
              </a>
            </div>
            <div>
              <p className="text-secondary mb-1 text-xs tracking-widest uppercase">
                {addressLabel}
              </p>
              <p className="text-foreground">{address}</p>
            </div>
            <div>
              <p className="text-secondary mb-1 text-xs tracking-widest uppercase">
                {hoursLabel}
              </p>
              <p className="text-foreground">{hours}</p>
            </div>
          </div>

          <div className="mt-10">
            <Button label={whatsappLabel} href={whatsappUrl} style="whatsapp" />
          </div>
        </div>

        {/* Right: form */}
        <div className="bg-muted p-8 sm:p-10">
          {submitted ? (
            <div className="flex h-full items-center justify-center py-16 text-center">
              <div>
                <div className="bg-secondary mx-auto mb-6 h-px w-12" />
                <p className="text-foreground font-[family-name:var(--font-heading)] text-2xl">
                  {successMessage}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {fields.map((field) => (
                <div key={field.name}>
                  <label
                    className="text-muted-foreground mb-2 block text-xs tracking-widest uppercase"
                    htmlFor={field.name}
                  >
                    {field.label}
                    {field.required && (
                      <span className="text-secondary ml-1">*</span>
                    )}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      required={field.required}
                      rows={4}
                      className="bg-background border-foreground/10 text-foreground focus:border-secondary focus-visible:ring-secondary w-full resize-none border px-4 py-3 text-sm transition-colors focus:outline-none focus-visible:ring-2"
                    />
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      required={field.required}
                      autoComplete={
                        field.type === "email"
                          ? "email"
                          : field.type === "tel"
                            ? "tel"
                            : field.name === "name"
                              ? "name"
                              : undefined
                      }
                      className="bg-background border-foreground/10 text-foreground focus:border-secondary focus-visible:ring-secondary w-full border px-4 py-3 text-sm transition-colors focus:outline-none focus-visible:ring-2"
                    />
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground focus-visible:ring-secondary w-full px-6 py-4 text-sm tracking-wide uppercase transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
              >
                {isSubmitting ? "\u2026" : submitLabel}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
