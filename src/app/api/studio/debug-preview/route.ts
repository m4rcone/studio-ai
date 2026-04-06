import { env } from "@/lib/studio/env";
import { getSession } from "@/lib/studio/session";
import { getUser, unauthorized } from "../_helpers";

/**
 * Debug endpoint — returns the raw GitHub Deployments and Checks data for the
 * active session's PR branch. Use this to diagnose preview URL detection issues.
 * Call: GET /api/studio/debug-preview
 */
export async function GET(): Promise<Response> {
  const user = await getUser();
  if (!user) return unauthorized();

  const session = getSession(user.username);
  if (!session) {
    return Response.json({ error: "No active session" }, { status: 404 });
  }

  const { owner, repo } = env.github;
  const headers = {
    Authorization: `Bearer ${env.github.token}`,
    Accept: "application/vnd.github.v3+json",
  };

  // Get PR details
  const prRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${session.prNumber}`,
    { headers },
  );
  const pr = (await prRes.json()) as { head: { ref: string; sha: string } };
  const branch = pr.head?.ref ?? "(unknown)";
  const sha = pr.head?.sha ?? "(unknown)";

  // All deployments for this branch
  const depsRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/deployments?ref=${encodeURIComponent(branch)}&per_page=10`,
    { headers },
  );
  const deployments = await depsRes.json();

  // Statuses for each deployment
  const deploymentDetails = [];
  if (Array.isArray(deployments)) {
    for (const dep of deployments as Array<{
      id: number;
      environment: string;
    }>) {
      const statusRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/deployments/${dep.id}/statuses`,
        { headers },
      );
      const statuses = await statusRes.json();
      deploymentDetails.push({
        id: dep.id,
        environment: dep.environment,
        statuses,
      });
    }
  }

  // Check runs for the head commit
  const checksRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=10`,
    { headers: { ...headers, Accept: "application/vnd.github+json" } },
  );
  const checks = await checksRes.json();

  return Response.json({
    branch,
    sha,
    session: {
      previewStatus: session.previewStatus,
      previewUrl: session.previewUrl,
      prNumber: session.prNumber,
    },
    deployments: deploymentDetails,
    checkRuns: (checks as { check_runs?: unknown[] }).check_runs ?? [],
  });
}
