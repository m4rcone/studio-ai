export interface TimelineEvent {
  /** Unique identifier. */
  id: string;
  /** Year or date label. E.g. "2010". Max ~8 characters. */
  year: string;
  /** Event title. Max ~60 characters. */
  title: string;
  /** Event description. Max ~150 characters. */
  description: string;
}

export interface TimelineProps {
  /** Eyebrow label. Max ~30 characters. */
  eyebrow: string;
  /** Section heading. Max ~60 characters. */
  headline: string;
  /** Array of timeline events in chronological order. */
  events: TimelineEvent[];
}

export function Timeline({ eyebrow, headline, events }: TimelineProps) {
  return (
    <section className="bg-muted px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <span className="text-secondary mb-4 block text-xs tracking-[0.2em] uppercase">
            {eyebrow}
          </span>
          <h2 className="text-foreground font-[family-name:var(--font-heading)] text-3xl sm:text-4xl">
            {headline}
          </h2>
        </div>
        <div className="relative">
          {/* Vertical line */}
          <div className="bg-foreground/10 absolute top-0 bottom-0 left-[80px] w-px -translate-x-1/2 sm:left-1/2" />
          <div className="space-y-12">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`flex gap-8 ${index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"} items-center`}
              >
                {/* Content block */}
                <div
                  className={`flex-1 ${index % 2 === 0 ? "sm:text-right" : "sm:text-left"} pl-24 sm:pl-0`}
                >
                  <div className="bg-background p-6">
                    <h3 className="text-foreground mb-2 font-[family-name:var(--font-heading)] text-lg">
                      {event.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
                {/* Year node */}
                <div className="bg-primary absolute left-[80px] z-10 flex h-16 w-16 flex-shrink-0 -translate-x-1/2 items-center justify-center sm:relative sm:left-auto sm:h-20 sm:w-20 sm:translate-x-0">
                  <span className="text-secondary font-[family-name:var(--font-heading)] text-sm font-normal sm:text-base">
                    {event.year}
                  </span>
                </div>
                {/* Spacer for opposite side */}
                <div className="hidden flex-1 sm:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
