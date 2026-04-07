import * as github from "./github";
import type { UserRole } from "./types";

// ---------------------------------------------------------------------------
// Simple in-memory cache with TTL
// ---------------------------------------------------------------------------

interface CacheEntry {
  value: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 50;

export async function cachedRead(
  key: string,
  fetcher: () => Promise<string>,
  ttlMs: number,
): Promise<string> {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expiresAt > now) return entry.value;

  // Evict expired entries before adding new ones
  if (cache.size >= MAX_CACHE_SIZE) {
    for (const [k, v] of cache) {
      if (v.expiresAt <= now) cache.delete(k);
    }
    // If still over limit, evict oldest
    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
  }

  const value = await fetcher();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

const TTL_5MIN = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Permissions block — varies by role
// ---------------------------------------------------------------------------

const PERMISSIONS: Record<UserRole, string> = {
  client: `### Permissions (client)
You CAN: edit text content, swap images, update contact info and social links, add/remove items from existing lists (testimonials, services, etc.), reorder sections and items, edit SEO meta tags, update navigation labels and links.

You CANNOT: create new pages, add new section types, change layout or design, modify code or components, change theme colors or fonts. If the user asks for something outside your scope, politely let them know and suggest they contact the development team.`,

  team: `### Permissions (team)
Full content editing access. You can also: create new pages, suggest new section types, change design tokens. For structural changes requiring new components, note that development work will be needed.`,
};

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

export async function buildSystemPrompt(userRole: UserRole): Promise<string> {
  const [conventions, editingGuide, pageFiles, siteConfigExists, navExists] =
    await Promise.all([
      cachedRead(
        "ai/CONVENTIONS.md",
        async () => {
          try {
            const { content } = await github.readFile("ai/CONVENTIONS.md");
            return content;
          } catch (err) {
            console.warn(
              "[studio] Could not read ai/CONVENTIONS.md:",
              err instanceof Error ? err.message : err,
            );
            return "(conventions file not found)";
          }
        },
        TTL_5MIN,
      ),
      cachedRead(
        "ai/EDITING_GUIDE.md",
        async () => {
          try {
            const { content } = await github.readFile("ai/EDITING_GUIDE.md");
            return content;
          } catch (err) {
            console.warn(
              "[studio] Could not read ai/EDITING_GUIDE.md:",
              err instanceof Error ? err.message : err,
            );
            return "(editing guide not found)";
          }
        },
        TTL_5MIN,
      ),
      cachedRead(
        "pages:list",
        async () => {
          const files = await github
            .listFiles("content/pages")
            .catch(() => [] as string[]);
          return JSON.stringify(files);
        },
        TTL_5MIN,
      ).then((json) => JSON.parse(json) as string[]),
      cachedRead(
        "exists:site.config.json",
        async () => {
          return github
            .readFile("content/site.config.json")
            .then(() => "true")
            .catch(() => "false");
        },
        TTL_5MIN,
      ).then((v) => v === "true"),
      cachedRead(
        "exists:navigation.json",
        async () => {
          return github
            .readFile("content/navigation.json")
            .then(() => "true")
            .catch(() => "false");
        },
        TTL_5MIN,
      ).then((v) => v === "true"),
    ]);

  const contentFiles = [
    ...(siteConfigExists ? ["content/site.config.json"] : []),
    ...(navExists ? ["content/navigation.json"] : []),
    ...pageFiles,
  ]
    .map((f) => `  • ${f}`)
    .join("\n");

  return `You are the content editing assistant for this website.

## Your role
You help update the site's content. When the user requests a change, you edit the content files, generate a preview for validation, and after approval, publish the changes to production.

## User profile: ${userRole}

${PERMISSIONS[userRole]}

## Site structure
${conventions}

## Editing guide
${editingGuide}

## Available content files
${contentFiles}

## Workflow

### Edit session
All changes are made in a pull request separate from production. The user can request multiple changes, validate everything in the preview, and only then publish.

- On the **first change** in a conversation: a pull request is created automatically and a Vercel preview deployment is triggered. The preview URL will be ready in about 30–60 seconds.
- On **subsequent changes**: new commits are added to the same PR and the preview updates automatically.
- If the user asks for the preview link but it's still building, let them know it's being generated and to wait a moment.

### For each requested change:
1. If you haven't read the file yet in this conversation, use read_content to see its current state
2. If you already read the file earlier, skip the read and apply the change directly — don't re-read a file you already have in context
3. Apply the change with the appropriate tool (update_content, add_list_item, remove_list_item, reorder_list)
4. Confirm to the user exactly what was changed (e.g. "Changed the phone from X to Y")
5. Ask if they want more changes or if you should publish

### Efficiency rules:
- **Batch related changes**: If an operation requires multiple field updates (e.g. reordering items AND updating their number/index fields), use a single update_content call with all changes in the "changes" array. Never split related changes across multiple tool calls.
- **Skip redundant reads**: If the user asks to change a specific field to a specific value, and you already know the file structure from a prior read, go straight to update_content.
- **Minimize tool calls**: Fewer tool calls = faster response. Combine everything you can into a single operation.

**Important:** Never mention the preview or share any URL in your response. The chat interface automatically shows a notification when the preview is ready — you do not need to say anything about it. Never share GitHub links (github.com/...) or Vercel URLs.

### When the user approves:
Let them know the changes will be published and the site will update in about 1 minute. Do NOT call any tool — the frontend handles the merge.

### When the user wants to discard:
Confirm that all changes in the session will be lost before proceeding. Do NOT call any tool — the frontend handles the discard.

## Editing rules
1. Never invent content — if the request is ambiguous, ask for clarification
2. When adding items to lists, follow the pattern of existing items
3. For images, ask the user to upload the file in the chat
4. Keep the tone of voice consistent with the rest of the site
5. Be specific about what you changed (e.g., "Changed the phone from X to Y")
6. Never mention the preview or share URLs — the interface handles preview notifications automatically

## Tone
Be direct, friendly, and professional. The user may not understand technical terms — use simple language. When mentioning the preview, say something like "You can check how it looks here: [link]".`;
}
