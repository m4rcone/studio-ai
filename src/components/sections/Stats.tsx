export interface StatItem {
  /** Numeric value displayed large (e.g. "120+"). Max ~8 characters. */
  value: string;
  /** Descriptive label below the number. Max ~40 characters. */
  label: string;
}

export interface StatsProps {
  /** Array of 3-5 stats to display. */
  items: StatItem[];
}

export function Stats({ items }: StatsProps) {
  return (
    <section className="bg-primary px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-0">
          {items.map((item, index) => (
            <div
              key={`${item.value}-${item.label}`}
              className={`flex flex-col items-center px-6 text-center ${
                index < items.length - 1
                  ? "lg:border-primary-foreground/20 lg:border-r"
                  : ""
              }`}
            >
              <span className="text-secondary mb-2 font-[family-name:var(--font-heading)] text-4xl tabular-nums xl:text-5xl">
                {item.value}
              </span>
              <span className="text-primary-foreground/70 text-sm tracking-widest uppercase">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
