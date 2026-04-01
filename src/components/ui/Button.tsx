import Link from "next/link";
import { BUTTON_STYLES } from "@/lib/button-styles";

interface ButtonProps {
  label: string;
  style?: "primary" | "secondary" | "whatsapp";
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Base button component. Renders a <Link> when href is provided,
 * or a <button> for actions without navigation.
 */
export function Button({
  label,
  style = "primary",
  href,
  onClick,
  className = "",
}: ButtonProps) {
  const base = `inline-block rounded-[var(--radius)] px-8 py-3 text-base font-semibold transition-opacity ${BUTTON_STYLES[style]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={base}>
        {label}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={base}>
      {label}
    </button>
  );
}
