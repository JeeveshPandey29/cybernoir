import { createSupabaseAdminClient } from "@/lib/supabase";

type AuditEventInput = {
  action: string;
  status: "SUCCESS" | "FAILURE";
  actorUserId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
  route?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordAuditEvent(event: AuditEventInput) {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("audit_logs").insert({
      action: event.action,
      status: event.status,
      actor_user_id: event.actorUserId ?? null,
      actor_email: event.actorEmail ?? null,
      ip_address: event.ipAddress ?? null,
      route: event.route ?? null,
      metadata: event.metadata ?? {},
    });
  } catch {
    // Do not break auth/profile flows if audit logging is not deployed yet.
  }
}
