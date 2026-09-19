import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-server";

export async function GET(request: Request) {
  try {
    const { client } = await requireAdmin(request);
    const [subscriptionsResult, usersResult, callsResult] = await Promise.all([
      client
        .from("member_subscriptions")
        .select(
          "id,user_id,status,starts_at,expires_at,payment_provider,membership_plans(name)",
        )
        .order("created_at", { ascending: false }),
      client
        .from("profiles")
        .select("id,full_name,email,phone,created_at")
        .order("created_at", { ascending: false }),
      client
        .from("scheduled_calls")
        .select("id,user_id,coach_id,coach_name,title,starts_at,ends_at,status,meeting_url,provider")
        .order("starts_at", { ascending: true }),
    ]);

    if (subscriptionsResult.error) throw subscriptionsResult.error;
    if (usersResult.error) throw usersResult.error;
    if (callsResult.error && callsResult.error.code !== "42P01") throw callsResult.error;

    return NextResponse.json({
      subscriptions: subscriptionsResult.data ?? [],
      users: usersResult.data ?? [],
      scheduledCalls: callsResult.error ? [] : callsResult.data ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    const unauthorized = /auth|session|administrator/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: unauthorized ? 401 : 500 },
    );
  }
}
