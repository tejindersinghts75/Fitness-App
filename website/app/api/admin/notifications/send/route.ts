import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin-server";

type PushTokenRow = {
  expo_push_token: string;
  user_id: string;
};

const expoPushUrl = "https://exp.host/--/api/v2/push/send";

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export async function POST(request: Request) {
  try {
    const { client } = await requireAdmin(request);
    const body = await request.json().catch(() => ({}));
    const title = String(body.title || "").trim();
    const message = String(body.body || body.message || "").trim();
    const userId = typeof body.userId === "string" ? body.userId : null;
    const data = body.data && typeof body.data === "object" ? body.data : {};

    if (!title || !message) {
      return NextResponse.json(
        { error: "Notification title and message are required." },
        { status: 400 },
      );
    }

    let query = client
      .from("push_tokens")
      .select("expo_push_token,user_id")
      .eq("enabled", true);

    if (userId) query = query.eq("user_id", userId);

    const { data: tokens, error } = await query;
    if (error) throw error;

    const uniqueTokens = Array.from(
      new Map(
        ((tokens || []) as PushTokenRow[]).map((row) => [row.expo_push_token, row]),
      ).values(),
    );

    if (!uniqueTokens.length) {
      return NextResponse.json({ sent: 0, message: "No active push tokens found." });
    }

    const tickets = [];
    for (const group of chunk(uniqueTokens, 100)) {
      const response = await fetch(expoPushUrl, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          group.map((row) => ({
            to: row.expo_push_token,
            sound: "default",
            title,
            body: message,
            data,
          })),
        ),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.errors?.[0]?.message || "Expo push request failed.");
      }
      tickets.push(result);
    }

    return NextResponse.json({ sent: uniqueTokens.length, tickets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send notification";
    const unauthorized = /auth|session|administrator/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: unauthorized ? 401 : 500 },
    );
  }
}
