import { env } from "@/lib/studio/env";
import { getUser, unauthorized } from "../_helpers";

interface GithubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
}

export interface CommitEntry {
  sha: string;
  message: string;
  date: string;
  author: string;
}

export async function GET(): Promise<Response> {
  const user = await getUser();
  if (!user) return unauthorized();

  const { owner, repo, defaultBranch } = env.github;

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?sha=${defaultBranch}&per_page=30`,
    {
      headers: {
        Authorization: `Bearer ${env.github.token}`,
        Accept: "application/vnd.github.v3+json",
      },
      // Revalidate at most every 60 seconds
      next: { revalidate: 60 },
    },
  );

  if (!res.ok) {
    return Response.json({ error: "Failed to fetch commits" }, { status: 502 });
  }

  const raw = (await res.json()) as GithubCommit[];

  // Keep studio edits (recognised by commit message prefix) and show all others
  // so the user gets a complete picture of what changed.
  const commits: CommitEntry[] = raw.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split("\n")[0], // first line only
    date: c.commit.author.date,
    author: c.commit.author.name,
  }));

  return Response.json({ commits });
}
