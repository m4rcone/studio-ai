import Image from "next/image";

export interface TeamMember {
  /** Unique identifier. */
  id: string;
  /** Full name. */
  name: string;
  /** Role/title. Max ~60 characters. */
  role: string;
  /** Short bio. Max ~200 characters. */
  bio: string;
  /** Profile photo. */
  image: {
    /** Image path. */
    src: string;
    /** Descriptive alt text. */
    alt: string;
  };
}

export interface TeamProps {
  /** Eyebrow label. Max ~30 characters. */
  eyebrow: string;
  /** Section heading. Max ~60 characters. */
  headline: string;
  /** Optional intro text. Max ~200 characters. */
  description?: string;
  /** Array of team members (typically 2 founders). */
  members: TeamMember[];
}

export function Team({ eyebrow, headline, description, members }: TeamProps) {
  return (
    <section className="bg-background px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16">
          <span className="text-secondary mb-4 block text-xs tracking-[0.2em] uppercase">
            {eyebrow}
          </span>
          <h2 className="text-foreground mb-4 font-[family-name:var(--font-heading)] text-3xl sm:text-4xl">
            {headline}
          </h2>
          {description && (
            <p className="text-muted-foreground max-w-xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:gap-16">
          {members.map((member) => (
            <div key={member.id} className="group">
              <div className="relative mb-6 aspect-[3/4] overflow-hidden">
                <Image
                  src={member.image.src}
                  alt={member.image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
              <div className="bg-secondary mb-3 h-px w-8" />
              <h3 className="text-foreground mb-1 font-[family-name:var(--font-heading)] text-xl">
                {member.name}
              </h3>
              <p className="text-secondary mb-3 text-xs tracking-widest uppercase">
                {member.role}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
