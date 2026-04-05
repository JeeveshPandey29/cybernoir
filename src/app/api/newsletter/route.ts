import { NextResponse } from "next/server";
import { subscribeToNewsletter } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email : "";
    const subscription = await subscribeToNewsletter(email);
    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error && typeof (error as { status?: number }).status === "number"
        ? (error as { status: number }).status
        : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to subscribe" },
      { status }
    );
  }
}
