export function ChatSidebar() {
  const capabilities = [
    { icon: "✏️", text: "Change texts, headlines and descriptions" },
    { icon: "🖼️", text: "Swap images and photos" },
    { icon: "📋", text: "Reorder sections or list items" },
    { icon: "➕", text: "Add or remove items" },
    { icon: "📄", text: "Edit multiple pages" },
  ];

  const tips = [
    "Your changes go to a preview first — you review before publishing.",
    "You can request multiple edits in a single message.",
    "Enter sends · Shift+Enter adds a new line.",
    "Not happy? Discard the changes and try again.",
  ];

  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-3 self-start py-4 xl:flex">
      <div className="bg-background border-muted/60 rounded-(--radius) border p-4 shadow-sm">
        <h3 className="text-foreground/60 mb-3 text-[10px] font-semibold tracking-widest uppercase">
          What you can do
        </h3>
        <ul className="space-y-3">
          {capabilities.map(({ icon, text }) => (
            <li key={text} className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-sm leading-none">
                {icon}
              </span>
              <span className="text-muted-foreground text-xs leading-snug">
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-background border-muted/60 rounded-(--radius) border p-4 shadow-sm">
        <h3 className="text-foreground/60 mb-3 text-[10px] font-semibold tracking-widest uppercase">
          Tips
        </h3>
        <ul className="space-y-2.5">
          {tips.map((tip) => (
            <li
              key={tip}
              className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed"
            >
              <span className="text-primary mt-1 shrink-0 text-[8px]">●</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-primary/5 border-primary/20 rounded-(--radius) border p-3">
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          Changes are published only after your approval.{" "}
          <span className="text-foreground font-medium">
            Nothing goes live without your review.
          </span>
        </p>
      </div>
    </aside>
  );
}
