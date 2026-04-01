/**
 * Button style map for use in sections with a neutral background (background/muted).
 * For sections with a primary background (e.g. Cta), use locally inverted styles instead.
 */
export const BUTTON_STYLES: Record<
  "primary" | "secondary" | "whatsapp",
  string
> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
  whatsapp: "bg-[#25D366] text-white hover:opacity-90",
};
