export interface FeaturesItem {
  /** Unique identifier for the item. Kebab-case format. E.g. "online-consultation". */
  id: string;
  /** Card title for the service or differentiator. Max ~60 characters. */
  title: string;
  /** Description of the service or differentiator. Max ~300 characters. */
  description: string;
  /** Decorative emoji displayed above the title. Optional. E.g. "🩺", "📱", "⭐". */
  icon?: string;
}

export interface FeaturesProps {
  /** Section heading. Recommended maximum 80 characters. */
  headline: string;
  /** Optional subtitle displayed below the section heading. Recommended maximum 200 characters. */
  subheadline?: string;
  /** List of service or differentiator cards. Minimum 1 item, maximum 9. Responsive grid: 1 col (mobile) → 2 cols (sm) → 3 cols (lg). */
  items: FeaturesItem[];
}

export function Features({ headline, subheadline, items }: FeaturesProps) {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight lg:text-4xl">
            {headline}
          </h2>
          {subheadline && (
            <p className="text-muted-foreground mt-4 text-lg">{subheadline}</p>
          )}
        </div>

        {/* Grid */}
        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="border-foreground/10 bg-muted flex flex-col gap-3 rounded-(--radius) border p-6"
            >
              {item.icon && (
                <span className="text-3xl leading-none" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <h3 className="text-foreground text-lg font-semibold">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
