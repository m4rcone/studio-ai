import { env } from "./env";

const BASE_URL = "https://api.github.com";

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${env.github.token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { ...options, headers: headers() });

  if (!res.ok) {
    let message = `GitHub API error ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message += `: ${body.message}`;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  // 204 No Content — nothing to parse
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Read a file from the repo (decoded from base64)
// ---------------------------------------------------------------------------
export async function readFile(
  path: string,
  branch: string = env.github.defaultBranch,
): Promise<{ content: string; sha: string }> {
  const { owner, repo } = env.github;
  const encoded = encodeURIComponent(path).replace(/%2F/g, "/");
  const data = await request<{ content: string; sha: string }>(
    `/repos/${owner}/${repo}/contents/${encoded}?ref=${branch}`,
  );

  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

// ---------------------------------------------------------------------------
// List files in a directory (returns file paths, not directories)
// ---------------------------------------------------------------------------
export async function listFiles(
  path: string,
  branch: string = env.github.defaultBranch,
): Promise<string[]> {
  const { owner, repo } = env.github;
  const encoded = encodeURIComponent(path).replace(/%2F/g, "/");
  const entries = await request<Array<{ type: string; path: string }>>(
    `/repos/${owner}/${repo}/contents/${encoded}?ref=${branch}`,
  );

  if (!Array.isArray(entries)) {
    throw new Error(`${path} is a file, not a directory`);
  }

  return entries.filter((e) => e.type === "file").map((e) => e.path);
}

// ---------------------------------------------------------------------------
// Create a new branch from a ref (defaults to the default branch)
// ---------------------------------------------------------------------------
export async function createBranch(
  branchName: string,
  fromRef: string = env.github.defaultBranch,
): Promise<void> {
  const { owner, repo } = env.github;

  const refData = await request<{ object: { sha: string } }>(
    `/repos/${owner}/${repo}/git/ref/heads/${fromRef}`,
  );

  await request(`/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: refData.object.sha,
    }),
  });
}

// ---------------------------------------------------------------------------
// Commit one or more file changes to a branch
// Sequentially PUTs each file using the Contents API.
// Returns the last commit SHA.
// ---------------------------------------------------------------------------
export async function commitFiles(
  branch: string,
  files: Array<{ path: string; content: string }>,
  message: string,
): Promise<{ sha: string }> {
  const { owner, repo } = env.github;

  let lastSha = "";

  for (const file of files) {
    let existingSha: string | undefined;
    try {
      const existing = await readFile(file.path, branch);
      existingSha = existing.sha;
    } catch {
      // File doesn't exist yet — creating it fresh
    }

    const encoded = encodeURIComponent(file.path).replace(/%2F/g, "/");
    const body: Record<string, string> = {
      message,
      content: Buffer.from(file.content, "utf-8").toString("base64"),
      branch,
    };
    if (existingSha) body.sha = existingSha;

    const result = await request<{ commit: { sha: string } }>(
      `/repos/${owner}/${repo}/contents/${encoded}`,
      { method: "PUT", body: JSON.stringify(body) },
    );

    lastSha = result.commit.sha;
  }

  return { sha: lastSha };
}

// ---------------------------------------------------------------------------
// Delete a branch
// ---------------------------------------------------------------------------
export async function deleteBranch(branch: string): Promise<void> {
  const { owner, repo } = env.github;

  await request(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Check if a branch exists
// ---------------------------------------------------------------------------
export async function branchExists(branch: string): Promise<boolean> {
  const { owner, repo } = env.github;

  try {
    await request(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
    return true;
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) return false;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Pull Requests
// ---------------------------------------------------------------------------

export async function createPullRequest(params: {
  title: string;
  body: string;
  head: string;
  base?: string;
}): Promise<{ number: number; html_url: string }> {
  const { owner, repo, defaultBranch } = env.github;

  return request<{ number: number; html_url: string }>(
    `/repos/${owner}/${repo}/pulls`,
    {
      method: "POST",
      body: JSON.stringify({
        title: params.title,
        body: params.body,
        head: params.head,
        base: params.base ?? defaultBranch,
      }),
    },
  );
}

export async function updatePullRequest(
  prNumber: number,
  body: string,
): Promise<void> {
  const { owner, repo } = env.github;

  await request(`/repos/${owner}/${repo}/pulls/${prNumber}`, {
    method: "PATCH",
    body: JSON.stringify({ body }),
  });
}

/** Squash-merge a pull request. */
export async function mergePullRequest(
  prNumber: number,
  commitTitle: string,
): Promise<void> {
  const { owner, repo } = env.github;

  await request(`/repos/${owner}/${repo}/pulls/${prNumber}/merge`, {
    method: "PUT",
    body: JSON.stringify({
      merge_method: "squash",
      commit_title: commitTitle,
    }),
  });
}

/** Close a pull request without merging. */
export async function closePullRequest(prNumber: number): Promise<void> {
  const { owner, repo } = env.github;

  await request(`/repos/${owner}/${repo}/pulls/${prNumber}`, {
    method: "PATCH",
    body: JSON.stringify({ state: "closed" }),
  });
}

// ---------------------------------------------------------------------------
// Preview URL (via GitHub Deployments API — populated by the Vercel bot)
// ---------------------------------------------------------------------------

/**
 * Fetches the Vercel preview URL for a PR branch from the GitHub Deployments API.
 * Returns null if the deployment hasn't completed yet.
 */
export async function getPreviewUrlFromPR(
  prNumber: number,
): Promise<string | null> {
  const { owner, repo } = env.github;

  // Get the branch name from the PR
  const pr = await request<{ head: { ref: string } }>(
    `/repos/${owner}/${repo}/pulls/${prNumber}`,
  );
  const branch = pr.head.ref;

  // Get Preview deployments for this branch
  const deployments = await request<Array<{ id: number; environment: string }>>(
    `/repos/${owner}/${repo}/deployments?ref=${encodeURIComponent(branch)}&environment=Preview&per_page=5`,
  );

  if (!Array.isArray(deployments) || deployments.length === 0) return null;

  const deployment = deployments[0];

  // Get deployment statuses; the Vercel bot sets state=success with an environment_url
  const statuses = await request<
    Array<{ state: string; environment_url?: string }>
  >(`/repos/${owner}/${repo}/deployments/${deployment.id}/statuses`);

  if (!Array.isArray(statuses)) return null;

  const success = statuses.find(
    (s) => s.state === "success" && s.environment_url,
  );
  return success?.environment_url ?? null;
}

/**
 * Polls for the Vercel preview URL with a configurable interval and retry limit.
 * Returns null if the URL is not available within the given window.
 */
export async function waitForPreviewUrl(
  prNumber: number,
  options: { maxAttempts?: number; intervalMs?: number } = {},
): Promise<string | null> {
  const { maxAttempts = 10, intervalMs = 5000 } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const url = await getPreviewUrlFromPR(prNumber);
      if (url) return url;
    } catch {
      // Transient error — keep polling
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  return null;
}
