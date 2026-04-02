interface StudioCardProps {
  children: React.ReactNode;
  className?: string;
}

export function StudioCard({ children, className = "" }: StudioCardProps) {
  return (
    <div
      className={`bg-background border-muted rounded-[var(--radius)] border p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
