import { NextResponse } from "next/server";
import {
  validateCredentials,
  createToken,
  COOKIE_OPTIONS,
} from "@/lib/studio/auth";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { username, password } = body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: "Username and password are required" },
      { status: 400 },
    );
  }

  const user = validateCredentials(username, password);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Invalid credentials" },
      { status: 401 },
    );
  }

  const token = await createToken(user);

  const response = NextResponse.json({
    success: true,
    user: { username: user.username, role: user.role },
  });
  response.cookies.set({ ...COOKIE_OPTIONS, value: token });
  return response;
}
