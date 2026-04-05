import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body as Record<string, string>;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // TODO: Integrate with an email service (Resend, SendGrid, etc.)
    // For now, log the submission server-side for verification.
    console.warn(
      `[contact] Form submission from ${name} <${email}> — phone: ${phone ?? "n/a"}`,
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
