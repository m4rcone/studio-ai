// Session state for an active editing session
export interface EditSession {
  branchName: string;
  /** GitHub Pull Request number (0 before the first commit creates the PR) */
  prNumber: number;
  /** GitHub Pull Request URL */
  prUrl: string;
  /** Vercel preview URL — null while the deployment is still building */
  previewUrl: string | null;
  /** Current state of the Vercel preview deployment */
  previewStatus: "building" | "ready" | "error";
  changes: ChangeRecord[];
  status: "active" | "merging" | "none";
  createdAt: string;
}

// Record of a single file change within a session
export interface ChangeRecord {
  file: string;
  description: string;
  timestamp: string;
}

// User role — 'client' for site owners, 'team' for internal editors
export type UserRole = "client" | "team";

// Events emitted by the agent stream (newline-delimited JSON)
export type StreamEvent =
  | { type: "text"; content: string }
  | { type: "tool_call"; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; name: string; summary: string }
  | { type: "done"; session: EditSession | null }
  | { type: "error"; message: string };

// Authenticated studio user
export interface StudioUser {
  username: string;
  role: UserRole;
}
