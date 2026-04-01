import type { ComponentType } from "react";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { Cta } from "@/components/sections/Cta";

export type SectionComponent = ComponentType<Record<string, unknown>>;

export const SECTION_REGISTRY: Record<string, SectionComponent> = {
  hero: Hero as unknown as SectionComponent,
  features: Features as unknown as SectionComponent,
  cta: Cta as unknown as SectionComponent,
};

const Fallback: SectionComponent = () => null;

export function getSectionComponent(type: string): SectionComponent {
  if (!(type in SECTION_REGISTRY)) {
    console.warn(
      `[section-registry] Unknown section type: "${type}". Check the data file and the registry.`,
    );
  }
  return SECTION_REGISTRY[type] ?? Fallback;
}
