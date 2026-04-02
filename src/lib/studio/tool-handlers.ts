import { env } from "./env";
import * as github from "./github";
import * as session from "./session";
import {
  getNestedValue,
  setNestedValue,
  removeFromArray,
  reorderArray,
} from "./json-path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converts a kebab-case section type to a PascalCase filename. */
function toPascalCase(type: string): string {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/** Derives the slug from a data file path. e.g. content/pages/home.data.json → home */
function slugFromPath(filePath: string): string {
  return filePath.split("/").pop()!.replace(".data.json", "");
}

/**
 * Ensures an active session exists for the user.
 * Creates one lazily using the provided description if none exists.
 */
async function ensureSession(
  username: string,
  description: string,
): Promise<ReturnType<typeof session.getSession> & object> {
  const existing = session.getSession(username);
  if (existing) return existing;
  return session.createSession(username, description);
}

/** Reads a JSON file from the active session branch (or main if no session). */
async function readJson(
  filePath: string,
  username: string,
): Promise<{ data: unknown; sha: string; branch: string }> {
  const activeSession = session.getSession(username);
  const branch = activeSession?.branchName ?? env.github.defaultBranch;
  const { content, sha } = await github.readFile(filePath, branch);
  return { data: JSON.parse(content), sha, branch };
}

/**
 * Commits a mutated JSON object to the session branch and records the change.
 * Returns a human-readable preview status message to include in tool results.
 */
async function commitJson(
  filePath: string,
  data: unknown,
  description: string,
  username: string,
): Promise<string> {
  const activeSession = await ensureSession(username, description);
  const branch = activeSession.branchName;
  const content = JSON.stringify(data, null, 2);

  await github.commitFiles(
    branch,
    [{ path: filePath, content }],
    `content(studio): ${description}`,
  );

  await session.recordChange(username, {
    file: filePath,
    description,
    timestamp: new Date().toISOString(),
  });

  const updated = session.getSession(username)!;
  const isFirst = updated.changes.length === 1;

  if (isFirst) {
    return "A preview is being generated and will be ready in about 30–60 seconds.";
  }
  if (updated.previewStatus === "ready" && updated.previewUrl) {
    return `Preview your changes at: ${updated.previewUrl}`;
  }
  return "The preview is updating automatically with your changes.";
}

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  context: { username: string },
): Promise<string> {
  const { username } = context;

  switch (toolName) {
    // -----------------------------------------------------------------------
    case "read_content": {
      const filePath = toolInput.file_path as string;
      const activeSession = session.getSession(username);
      const branch = activeSession?.branchName ?? env.github.defaultBranch;
      const { content } = await github.readFile(filePath, branch);
      const fromNote = activeSession
        ? `(reading from session branch: ${activeSession.branchName})`
        : `(reading from ${branch})`;
      return `File: ${filePath} ${fromNote}\n\n${content}`;
    }

    // -----------------------------------------------------------------------
    case "update_content": {
      const filePath = toolInput.file_path as string;
      const changes = toolInput.changes as Array<{
        path: string;
        value: unknown;
      }>;

      const { data } = await readJson(filePath, username);
      const applied: string[] = [];

      for (const change of changes) {
        setNestedValue(data, change.path, change.value);
        applied.push(`  • ${change.path} → ${JSON.stringify(change.value)}`);
      }

      const description = `update ${filePath.split("/").pop()} (${changes.map((c) => c.path).join(", ")})`;
      const previewUrl = await commitJson(
        filePath,
        data,
        description,
        username,
      );

      return [`Updated ${filePath}:`, ...applied, ``, previewUrl].join("\n");
    }

    // -----------------------------------------------------------------------
    case "add_list_item": {
      const filePath = toolInput.file_path as string;
      const listPath = toolInput.list_path as string;
      const item = toolInput.item as unknown;
      const position = (toolInput.position as string | undefined) ?? "end";

      const { data } = await readJson(filePath, username);
      const arr = getNestedValue(data, listPath);
      if (!Array.isArray(arr)) {
        throw new Error(`Path "${listPath}" in ${filePath} is not an array`);
      }

      if (position === "start") {
        arr.unshift(item);
      } else {
        arr.push(item);
      }

      const description = `add item to ${listPath} in ${filePath.split("/").pop()}`;
      const previewUrl = await commitJson(
        filePath,
        data,
        description,
        username,
      );

      return [
        `Added item to "${listPath}" in ${filePath} (at ${position}).`,
        previewUrl,
      ].join("\n");
    }

    // -----------------------------------------------------------------------
    case "remove_list_item": {
      const filePath = toolInput.file_path as string;
      const listPath = toolInput.list_path as string;
      const match = toolInput.match as Record<string, unknown>;

      const { data } = await readJson(filePath, username);
      const removed = removeFromArray(data, listPath, match);

      if (!removed) {
        return `No item matching ${JSON.stringify(match)} found in "${listPath}" of ${filePath}. Nothing was changed.`;
      }

      const description = `remove item from ${listPath} in ${filePath.split("/").pop()}`;
      const previewUrl = await commitJson(
        filePath,
        data,
        description,
        username,
      );

      return [
        `Removed item matching ${JSON.stringify(match)} from "${listPath}" in ${filePath}.`,
        previewUrl,
      ].join("\n");
    }

    // -----------------------------------------------------------------------
    case "reorder_list": {
      const filePath = toolInput.file_path as string;
      const listPath = toolInput.list_path as string;
      const newOrder = toolInput.new_order as number[];

      const { data } = await readJson(filePath, username);
      reorderArray(data, listPath, newOrder);

      const description = `reorder ${listPath} in ${filePath.split("/").pop()}`;
      const previewUrl = await commitJson(
        filePath,
        data,
        description,
        username,
      );

      return [
        `Reordered "${listPath}" in ${filePath} with order [${newOrder.join(", ")}].`,
        previewUrl,
      ].join("\n");
    }

    // -----------------------------------------------------------------------
    case "list_pages": {
      const filePaths = await github.listFiles("content/pages");
      const dataFiles = filePaths.filter((p) => p.endsWith(".data.json"));

      const pages = await Promise.all(
        dataFiles.map(async (filePath) => {
          try {
            const { content } = await github.readFile(filePath);
            const data = JSON.parse(content) as {
              slug?: string;
              meta?: { title?: string };
              sections?: unknown[];
            };
            const slug = data.slug ?? slugFromPath(filePath);
            const title = data.meta?.title ?? "(no title)";
            const sectionCount = data.sections?.length ?? 0;
            return `  • /${slug}  "${title}"  (${sectionCount} sections)`;
          } catch {
            return `  • ${filePath}  (could not read)`;
          }
        }),
      );

      return `Pages in this site:\n${pages.join("\n")}`;
    }

    // -----------------------------------------------------------------------
    case "get_component_types": {
      const sectionType = toolInput.section_type as string;
      const componentName = toPascalCase(sectionType);
      const filePath = `src/components/sections/${componentName}.tsx`;

      try {
        const { content } = await github.readFile(filePath);
        return `Component file: ${filePath}\n\n${content}`;
      } catch {
        // Try to list what's available to help the agent recover
        const available = await github.listFiles("src/components/sections");
        const names = available
          .map((p) => p.split("/").pop()!.replace(".tsx", ""))
          .join(", ");
        return (
          `Component "${componentName}.tsx" not found for type "${sectionType}". ` +
          `Available components: ${names}`
        );
      }
    }

    // -----------------------------------------------------------------------
    case "get_session_status": {
      const activeSession = session.getSession(username);
      if (!activeSession) {
        return "No active edit session. Changes will create a new session automatically.";
      }
      const previewLine =
        activeSession.previewStatus === "ready" && activeSession.previewUrl
          ? `Preview URL: ${activeSession.previewUrl}`
          : `Preview: ${activeSession.previewStatus}`;

      const lines = [
        `Status: ${activeSession.status}`,
        `Branch: ${activeSession.branchName}`,
        activeSession.prUrl
          ? `PR: ${activeSession.prUrl} (#${activeSession.prNumber})`
          : "PR: not created yet",
        previewLine,
        `Created: ${activeSession.createdAt}`,
        `Changes so far (${activeSession.changes.length}):`,
        ...activeSession.changes.map(
          (c, i) => `  ${i + 1}. [${c.timestamp}] ${c.file} — ${c.description}`,
        ),
      ];
      return lines.join("\n");
    }

    // -----------------------------------------------------------------------
    default:
      throw new Error(`Unknown tool: "${toolName}"`);
  }
}
