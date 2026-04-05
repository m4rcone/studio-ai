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
    `https://api.github.com/repos/${owner}/${repo}/commits?sha=${defaultBranch}&per_page=100`,
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

  const studioCommits = raw.filter((c) => {
    const firstLine = c.commit.message.split("\n")[0];
    return (
      firstLine.startsWith("content(studio):") ||
      firstLine.startsWith("chore(studio):") ||
      firstLine.startsWith("Studio AI:")
    );
  });

  const commits: CommitEntry[] = studioCommits.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split("\n")[0], // first line only
    date: c.commit.author.date,
    author: c.commit.author.name,
  }));

  return Response.json({ commits });
}
