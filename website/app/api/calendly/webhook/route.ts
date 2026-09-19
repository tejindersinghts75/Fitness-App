import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serverSupabase } from "../../../../lib/admin-server";

type ScheduledEvent = {
  uri?: string;
  name?: string;
  start_time?: string;
  end_time?: string;
  location?: { location?: string; join_url?: string } | null;
  event_memberships?: Array<{ user_name?: string }>;
};
type WebhookPayload = {
  event?: "invitee.created" | "invitee.canceled";
  payload?: {
    email?: string;
    name?: string;
    status?: string;
    scheduled_event?: ScheduledEvent;
  };
};

const normalizeEmail = (value: string | null | undefined) => (value || "").trim().toLowerCase();
const uuid = (uri: string | undefined) => (uri || "").split("/").filter(Boolean).at(-1) || "";
const messageOf = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String(error.message);
  return "Calendly webhook failed";
};

function verifySignature(rawBody: string, header: string | null, signingKey: string) {
  if (!header) return false;
  const values = Object.fromEntries(header.split(",").map(part => part.split("=", 2)));
  const timestamp = values.t;
  const signature = values.v1;
  if (!timestamp || !signature || Math.abs(Date.now() / 1000 - Number(timestamp)) > 180) return false;
  const expected = createHmac("sha256", signingKey).update(`${timestamp}.${rawBody}`).digest("hex");
  const receivedBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!signingKey || !verifySignature(rawBody, request.headers.get("calendly-webhook-signature"), signingKey)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody) as WebhookPayload;
    const invitee = body.payload;
    const event = invitee?.scheduled_event;
    const email = normalizeEmail(invitee?.email);
    const eventId = uuid(event?.uri);
    if (!invitee || !event || !email || !eventId) return NextResponse.json({ received: true, ignored: true });

    const client = serverSupabase();
    const { data: profile, error: profileError } = await client.from("profiles").select("id").eq("email", email).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return NextResponse.json({ received: true, ignored: true });
    const providerEventId = `${eventId}:${email}`;

    if (body.event === "invitee.canceled" || invitee.status === "canceled") {
      const { error } = await client.from("scheduled_calls").update({ status: "cancelled" }).eq("provider", "calendly").eq("provider_event_id", providerEventId);
      if (error) throw error;
      return NextResponse.json({ received: true, status: "cancelled" });
    }
    if (body.event !== "invitee.created" || !event.start_time) return NextResponse.json({ received: true, ignored: true });

    const calendlyCoachName = event.event_memberships?.[0]?.user_name || "Fitora Coach";
    const { data: coaches, error: coachesError } = await client.from("coaches").select("id,name").eq("is_active", true);
    if (coachesError) throw coachesError;
    const coach = (coaches || []).find(item => calendlyCoachName.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(calendlyCoachName.toLowerCase()));
    const meetingUrl = event.location?.join_url || (event.location?.location?.startsWith("https://") ? event.location.location : null);
    const { error } = await client.from("scheduled_calls").upsert({
      user_id: profile.id,
      coach_id: coach?.id || null,
      coach_name: coach?.name || calendlyCoachName,
      title: event.name || "Consultation call",
      starts_at: event.start_time,
      ends_at: event.end_time || null,
      status: "scheduled",
      meeting_url: meetingUrl,
      provider: "calendly",
      provider_event_id: providerEventId,
      notes: invitee.name ? `Booked by ${invitee.name}` : null,
    }, { onConflict: "provider,provider_event_id" });
    if (error) throw error;
    return NextResponse.json({ received: true, status: "scheduled" });
  } catch (error) {
    console.error("Calendly webhook error", messageOf(error));
    return NextResponse.json({ error: messageOf(error) }, { status: 500 });
  }
}
