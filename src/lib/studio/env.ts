function require(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function parseStudioUsers(
  raw: string,
): Array<{ username: string; role: string }> {
  return raw
    .split(",")
    .map((pair) => {
      const colonIdx = pair.indexOf(":");
      if (colonIdx === -1)
        throw new Error(`Invalid STUDIO_USERS entry: "${pair}"`);
      return {
        username: pair.slice(0, colonIdx).trim(),
        role: pair.slice(colonIdx + 1).trim(),
      };
    })
    .filter((u) => u.username && u.role);
}

export const env = {
  github: {
    token: require("GITHUB_TOKEN"),
    owner: require("GITHUB_OWNER"),
    repo: require("GITHUB_REPO"),
    defaultBranch: optional("GITHUB_DEFAULT_BRANCH", "main"),
  },
  anthropic: {
    apiKey: require("ANTHROPIC_API_KEY"),
  },
  auth: {
    secret: require("AUTH_SECRET"),
    studioUsers: parseStudioUsers(require("STUDIO_USERS")),
    studioPassword: require("STUDIO_PASSWORD"),
  },
  vercel: {
    // Vercel automatically injects VERCEL_AUTOMATION_BYPASS_SECRET into all
    // functions once "Protection Bypass for Automation" is configured in
    // Project Settings → Deployment Protection. No manual setup needed.
    // Falls back to VERCEL_BYPASS_SECRET for local overrides.
    bypassSecret: optional(
      "VERCEL_AUTOMATION_BYPASS_SECRET",
      optional("VERCEL_BYPASS_SECRET", ""),
    ),
  },
} as const;

export type Env = typeof env;
