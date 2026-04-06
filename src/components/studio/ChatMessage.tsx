import type { ToolCallStatus } from "./ChatInterface";

// ── Markdown renderer ─────────────────────────────────────────────────────────

// Pattern: **bold** | *italic* | `code` | [link](url)
// Bold must come before italic to avoid mis-matching ** as two *
const INLINE_PATTERN =
  /(\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;

function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE_PATTERN.lastIndex = 0;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));

    const key = match.index;
    if (match[2] !== undefined) {
      nodes.push(<strong key={key}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(<em key={key}>{match[3]}</em>);
    } else if (match[4] !== undefined) {
      nodes.push(
        <code
          key={key}
          className="bg-muted/60 rounded px-1 py-0.5 font-mono text-xs"
        >
          {match[4]}
        </code>,
      );
    } else if (match[5] !== undefined && match[6] !== undefined) {
      nodes.push(
        <a
          key={key}
          href={match[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
        >
          {match[5]}
        </a>,
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length > 0 ? nodes : [text];
}

function renderMarkdown(text: string): React.ReactNode {
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");

        // Unordered list
        if (lines.every((l) => /^[-*]\s/.test(l))) {
          return (
            <ul key={bi} className="my-1.5 list-inside list-disc space-y-0.5">
              {lines.map((l, i) => (
                <li key={i}>{parseInline(l.replace(/^[-*]\s/, ""))}</li>
              ))}
            </ul>
          );
        }

        // Ordered list
        if (lines.every((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol
              key={bi}
              className="my-1.5 list-inside list-decimal space-y-0.5"
            >
              {lines.map((l, i) => (
                <li key={i}>{parseInline(l.replace(/^\d+\.\s+/, ""))}</li>
              ))}
            </ol>
          );
        }

        // Heading (##, ###)
        const hm = block.match(/^(#{1,3})\s(.+)/);
        if (hm) {
          const cls =
            hm[1].length === 1
              ? "mt-3 mb-1 font-semibold"
              : "mt-2 mb-0.5 font-medium";
          return (
            <p key={bi} className={cls}>
              {parseInline(hm[2])}
            </p>
          );
        }

        // Regular paragraph
        return (
          <p key={bi} className={bi > 0 ? "mt-2" : ""}>
            {lines.map((line, li) => (
              <span key={li}>
                {li > 0 && <br />}
                {parseInline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}

// ── Tool labels ───────────────────────────────────────────────────────────────

const TOOL_LABELS: Record<
  string,
  { icon: string; loading: string; done: string }
> = {
  read_content: { icon: "📄", loading: "Reading file…", done: "File read" },
  update_content: {
    icon: "✏️",
    loading: "Updating content…",
    done: "Content updated",
  },
  add_list_item: { icon: "➕", loading: "Adding item…", done: "Item added" },
  remove_list_item: {
    icon: "🗑️",
    loading: "Removing item…",
    done: "Item removed",
  },
  reorder_list: { icon: "↕️", loading: "Reordering…", done: "Reordered" },
  list_pages: { icon: "📋", loading: "Listing pages…", done: "Pages listed" },
  get_component_types: {
    icon: "🔍",
    loading: "Checking component…",
    done: "Component checked",
  },
  get_session_status: {
    icon: "📊",
    loading: "Checking session…",
    done: "Session status",
  },
};

function ToolIndicator({ tc }: { tc: ToolCallStatus }) {
  const label = TOOL_LABELS[tc.name] ?? {
    icon: "⚙️",
    loading: `${tc.name}…`,
    done: tc.name,
  };
  const isDone = tc.status === "done";

  return (
    <div
      className={`flex items-center gap-1.5 py-0.5 text-xs ${
        isDone ? "text-muted-foreground" : "text-foreground/70"
      }`}
    >
      <span>{label.icon}</span>
      <span className={isDone ? "" : "animate-pulse"}>
        {isDone
          ? tc.summary
            ? tc.summary.split("\n")[0].slice(0, 80)
            : label.done
          : label.loading}
      </span>
      {isDone && <span className="text-green-600">✓</span>}
    </div>
  );
}

// ── ChatMessage ───────────────────────────────────────────────────────────────

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCallStatus[];
  isStreaming?: boolean;
  isError?: boolean;
  isSystem?: boolean;
  onRetry?: () => void;
}

export function ChatMessage({
  role,
  content,
  toolCalls = [],
  isStreaming,
  isError,
  isSystem,
  onRetry,
}: ChatMessageProps) {
  const isUser = role === "user";

  // System messages render as centered dividers (not chat bubbles)
  if (isSystem) {
    return (
      <div className="my-3 flex items-center gap-3">
        <div className="bg-muted/40 h-px flex-1" />
        <p className="text-muted-foreground text-xs">{parseInline(content)}</p>
        <div className="bg-muted/40 h-px flex-1" />
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div
          role="img"
          aria-label="AI assistant"
          className={`mt-0.5 mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
            isError ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
          }`}
        >
          {isError ? "!" : "AI"}
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-[var(--radius)] px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : isError
              ? "border border-red-200 bg-red-50 text-red-700"
              : "bg-muted/60 text-foreground"
        }`}
      >
        {/* Tool indicators (assistant only) */}
        {toolCalls.length > 0 && (
          <div className="border-foreground/10 mb-2 flex flex-col gap-0.5 border-b pb-2">
            {toolCalls.map((tc, i) => (
              <ToolIndicator key={i} tc={tc} />
            ))}
          </div>
        )}

        {/* Content */}
        {content ? (
          isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            // Append the cursor character to the content string so it renders
            // inline at the end of the last paragraph, not as a separate element.
            <div>{renderMarkdown(isStreaming ? content + "▌" : content)}</div>
          )
        ) : isStreaming ? (
          /* Typing indicator — shown while waiting for first token */
          <div className="flex items-center gap-1 py-0.5">
            <span
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        ) : null}

        {/* Retry button for error messages */}
        {isError && onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 cursor-pointer text-xs font-medium text-red-600 underline underline-offset-2 hover:text-red-700"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
