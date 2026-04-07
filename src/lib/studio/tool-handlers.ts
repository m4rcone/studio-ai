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
// Validation
// ---------------------------------------------------------------------------

const ALLOWED_PREFIXES = ["content/", "src/components/sections/", "ai/"];

/** Validates that a file path stays within allowed directories. */
function validateFilePath(filePath: string): void {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Missing or invalid file_path parameter.");
  }
  if (filePath.startsWith("/") || filePath.startsWith("\\")) {
    throw new Error("Absolute paths are not allowed.");
  }
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.includes("..")) {
    throw new Error("Path traversal (..) is not allowed.");
  }
  if (!ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    throw new Error(
      `Access denied. Files must be under: ${ALLOWED_PREFIXES.join(", ")}`,
    );
  }
}

/** Validates that a value is a non-empty string. */
function requireString(input: Record<string, unknown>, key: string): string {
  const val = input[key];
  if (typeof val !== "string" || val.length === 0) {
    throw new Error(
      `Missing or invalid parameter: "${key}" (expected non-empty string)`,
    );
  }
  return val;
}

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
  sha?: string,
): Promise<string> {
  const activeSession = await ensureSession(username, description);
  const branch = activeSession.branchName;
  const content = JSON.stringify(data, null, 2);

  await github.commitFiles(
    branch,
    [{ path: filePath, content, sha }],
    `content(studio): ${description}`,
  );

  await session.recordChange(username, {
    file: filePath,
    description,
    timestamp: new Date().toISOString(),
  });

  // Return empty — preview notifications are handled by the UI via session_update
  // stream events. The agent should not mention preview status in its response.
  return "";
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
      const filePath = requireString(toolInput, "file_path");
      validateFilePath(filePath);
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
      const filePath = requireString(toolInput, "file_path");
      validateFilePath(filePath);
      const changes = toolInput.changes as Array<{
        path: string;
        value: unknown;
      }>;

      const { data, sha } = await readJson(filePath, username);
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
        sha,
      );

      return [`Updated ${filePath}:`, ...applied, ``, previewUrl].join("\n");
    }

    // -----------------------------------------------------------------------
    case "add_list_item": {
      const filePath = requireString(toolInput, "file_path");
      validateFilePath(filePath);
      const listPath = requireString(toolInput, "list_path");
      const item = toolInput.item as unknown;
      const position = (toolInput.position as string | undefined) ?? "end";

      const { data, sha } = await readJson(filePath, username);
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
        sha,
      );

      return [
        `Added item to "${listPath}" in ${filePath} (at ${position}).`,
        previewUrl,
      ].join("\n");
    }

    // -----------------------------------------------------------------------
    case "remove_list_item": {
      const filePath = requireString(toolInput, "file_path");
      validateFilePath(filePath);
      const listPath = requireString(toolInput, "list_path");
      const match = toolInput.match as Record<string, unknown>;

      const { data, sha } = await readJson(filePath, username);
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
        sha,
      );

      return [
        `Removed item matching ${JSON.stringify(match)} from "${listPath}" in ${filePath}.`,
        previewUrl,
      ].join("\n");
    }

    // -----------------------------------------------------------------------
    case "reorder_list": {
      const filePath = requireString(toolInput, "file_path");
      validateFilePath(filePath);
      const listPath = requireString(toolInput, "list_path");
      const newOrder = toolInput.new_order as number[];

      const { data, sha } = await readJson(filePath, username);
      reorderArray(data, listPath, newOrder);

      const description = `reorder ${listPath} in ${filePath.split("/").pop()}`;
      const previewUrl = await commitJson(
        filePath,
        data,
        description,
        username,
        sha,
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
      const sectionType = requireString(toolInput, "section_type");
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
