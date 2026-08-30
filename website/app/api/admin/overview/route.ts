import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-server";

export async function GET(request: Request) {
  try {
    const { client } = await requireAdmin(request);
    const [subscriptionsResult, usersResult] = await Promise.all([
      client
        .from("user_subscriptions")
        .select(
          "id,user_id,status,starts_at,expires_at,payment_provider,packages(name)",
        )
        .order("created_at", { ascending: false }),
      client
        .from("profiles")
        .select("id,full_name,email,phone,created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (subscriptionsResult.error) throw subscriptionsResult.error;
    if (usersResult.error) throw usersResult.error;

    return NextResponse.json({
      subscriptions: subscriptionsResult.data ?? [],
      users: usersResult.data ?? [],
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
