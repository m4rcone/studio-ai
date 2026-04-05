"use client";

import { useEffect, useRef, useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function handleSend() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-muted bg-background shrink-0 border-t p-3">
      <div className="border-muted bg-muted/30 focus-within:border-primary/40 focus-within:ring-primary/20 flex items-end gap-2 rounded-[var(--radius)] border px-3 py-2 transition-all focus-within:ring-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you'd like to change… (Enter to send, Shift+Enter for new line)"
          disabled={disabled}
          rows={1}
          className="text-foreground placeholder:text-muted-foreground max-h-40 flex-1 resize-none bg-transparent text-sm focus:outline-none disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="bg-primary text-primary-foreground mb-0.5 shrink-0 cursor-pointer rounded-[var(--radius)] px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {disabled ? (
            <span className="flex items-center gap-1">
              <span className="h-1 w-1 animate-ping rounded-full bg-current" />
              <span
                className="h-1 w-1 animate-ping rounded-full bg-current"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-1 w-1 animate-ping rounded-full bg-current"
                style={{ animationDelay: "300ms" }}
              />
            </span>
          ) : (
            "Send"
          )}
        </button>
      </div>
      <p className="text-muted-foreground/60 mt-1.5 text-center text-[10px]">
        Changes are previewed before publishing. You can review and approve
        before going live.
      </p>
    </div>
  );
}
