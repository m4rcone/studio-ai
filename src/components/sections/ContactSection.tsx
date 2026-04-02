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
}: ContactSectionProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
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
                Telefone
              </p>
              <a
                href={`tel:${phone}`}
                className="text-foreground hover:text-secondary transition-colors"
              >
                {phone}
              </a>
            </div>
            <div>
              <p className="text-secondary mb-1 text-xs tracking-widest uppercase">
                E-mail
              </p>
              <a
                href={`mailto:${email}`}
                className="text-foreground hover:text-secondary transition-colors"
              >
                {email}
              </a>
            </div>
            <div>
              <p className="text-secondary mb-1 text-xs tracking-widest uppercase">
                Endereço
              </p>
              <p className="text-foreground">{address}</p>
            </div>
            <div>
              <p className="text-secondary mb-1 text-xs tracking-widest uppercase">
                Horário
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
                      className="bg-background border-foreground/10 text-foreground focus:border-secondary w-full resize-none border px-4 py-3 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
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
                      className="bg-background border-foreground/10 text-foreground focus:border-secondary w-full border px-4 py-3 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                    />
                  )}
                </div>
              ))}
              <button
                type="submit"
                className="bg-primary text-primary-foreground w-full px-6 py-4 text-sm tracking-wide uppercase transition-opacity hover:opacity-90"
              >
                {submitLabel}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
