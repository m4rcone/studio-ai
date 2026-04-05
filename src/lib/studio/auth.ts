import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";
import type { StudioUser, UserRole } from "./types";

const COOKIE_NAME = "studio-token";
const JWT_EXPIRY = "7d";

function secret(): Uint8Array {
  return new TextEncoder().encode(env.auth.secret);
}

// ---------------------------------------------------------------------------
// Credential validation
// ---------------------------------------------------------------------------

/**
 * Checks username + password against env configuration.
 * Returns the matching StudioUser or null.
 */
export function validateCredentials(
  username: string,
  password: string,
): StudioUser | null {
  if (password !== env.auth.studioPassword) return null;
  const found = env.auth.studioUsers.find((u) => u.username === username);
  if (!found) return null;
  return { username: found.username, role: found.role as UserRole };
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

export async function createToken(user: StudioUser): Promise<string> {
  return new SignJWT({ username: user.username, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret());
}

export async function verifyToken(token: string): Promise<StudioUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    const username = payload.username as string | undefined;
    const role = payload.role as string | undefined;
    if (!username || !role) return null;
    return { username, role: role as UserRole };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cookie helpers for route handlers (Node.js runtime only)
// ---------------------------------------------------------------------------

export { COOKIE_NAME };

export const COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds (matches JWT_EXPIRY)
  path: "/",
};
