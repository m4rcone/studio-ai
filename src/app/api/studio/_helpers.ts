import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/studio/auth";
import type { StudioUser } from "@/lib/studio/types";

/**
 * Reads the studio-token cookie and returns the authenticated user.
 * Returns null if the token is missing or invalid.
 * (Middleware already blocks unauthenticated requests — this is a second layer
 * that also gives us the user's email and role.)
 */
export async function getUser(): Promise<StudioUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function unauthorized(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
