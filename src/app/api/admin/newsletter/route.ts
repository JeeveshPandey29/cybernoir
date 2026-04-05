import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getNewsletterSubscribers, updateNewsletterSubscriptionStatus } from "@/lib/db";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscribers = await getNewsletterSubscribers();
    return NextResponse.json({ subscribers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load subscribers" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id : "";
    const active = Boolean(body.active);

    if (!id) {
      return NextResponse.json({ error: "Subscriber id is required" }, { status: 400 });
    }

    const subscriber = await updateNewsletterSubscriptionStatus(id, active);
    return NextResponse.json({ subscriber });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update subscriber" },
      { status: 500 }
    );
  }
}
