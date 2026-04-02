import Image from "next/image";
import Link from "next/link";

export interface PortfolioPreviewItem {
  /** Unique identifier for the project. */
  id: string;
  /** Project name. Max ~50 characters. */
  name: string;
  /** City and state of the project. E.g. "São Paulo, SP". */
  location: string;
  /** Project category. */
  category: "residential" | "commercial" | "corporate";
  /** Project image. */
  image: {
    /** Image path. */
    src: string;
    /** Descriptive alt text. */
    alt: string;
  };
  /** Optional link to the full project page. */
  href?: string;
}

export interface PortfolioPreviewProps {
  /** Section eyebrow label above the title. Max ~30 characters. */
  eyebrow: string;
  /** Section heading. Max ~60 characters. */
  headline: string;
  /** Optional subheadline. Max ~150 characters. */
  subheadline?: string;
  /** Link to full portfolio page. */
  viewAllLabel: string;
  /** Link href for full portfolio. */
  viewAllHref: string;
  /** Array of 3-4 featured projects. */
  items: PortfolioPreviewItem[];
}

const CATEGORY_LABEL: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  corporate: "Corporate",
};

export function PortfolioPreview({
  eyebrow,
  headline,
  subheadline,
  viewAllLabel,
  viewAllHref,
  items,
}: PortfolioPreviewProps) {
  const [first, ...rest] = items;

  return (
    <section className="bg-background px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-secondary mb-3 block text-xs tracking-[0.2em] uppercase">
              {eyebrow}
            </span>
            <h2 className="text-foreground font-[family-name:var(--font-heading)] text-3xl sm:text-4xl">
              {headline}
            </h2>
            {subheadline && (
              <p className="text-muted-foreground mt-3 max-w-md">
                {subheadline}
              </p>
            )}
          </div>
          <Link
            href={viewAllHref}
            className="text-foreground hover:text-secondary text-sm whitespace-nowrap underline underline-offset-4 transition-colors"
          >
            {viewAllLabel} →
          </Link>
        </div>

        {/* Asymmetric grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Large featured item */}
            {first && (
              <ProjectCard
                item={first}
                className="aspect-[3/4] md:row-span-2 md:aspect-auto md:min-h-[600px]"
              />
            )}
            {/* Smaller items */}
            <div className="grid grid-cols-1 gap-4">
              {rest.map((item) => (
                <ProjectCard
                  key={item.id}
                  item={item}
                  className="aspect-[4/3]"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ProjectCard({
  item,
  className = "",
}: {
  item: PortfolioPreviewItem;
  className?: string;
}) {
  const inner = (
    <div
      className={`group relative cursor-pointer overflow-hidden ${className}`}
    >
      <Image
        src={item.image.src}
        alt={item.image.alt}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      {/* Overlay */}
      <div className="bg-foreground/0 group-hover:bg-foreground/50 absolute inset-0 transition-[background-color] duration-500" />
      {/* Content on hover */}
      <div className="absolute inset-0 flex translate-y-4 flex-col justify-end p-6 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="text-secondary mb-1 text-xs tracking-widest uppercase">
          {CATEGORY_LABEL[item.category] ?? item.category}
        </span>
        <h3 className="mb-1 font-[family-name:var(--font-heading)] text-xl text-white">
          {item.name}
        </h3>
        <p className="text-sm text-white/70">{item.location}</p>
      </div>
      {/* Always-visible subtle category badge */}
      <div className="bg-background/90 text-foreground absolute top-4 left-4 px-3 py-1 text-xs tracking-wider uppercase transition-opacity duration-300 group-hover:opacity-0">
        {CATEGORY_LABEL[item.category] ?? item.category}
      </div>
    </div>
  );

  if (item.href) {
    return <Link href={item.href}>{inner}</Link>;
  }
  return inner;
}
