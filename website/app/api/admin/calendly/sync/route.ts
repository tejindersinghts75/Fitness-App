import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin-server";

const calendlyApi = "https://api.calendly.com";

type CalendlyCollection<T> = {
  collection?: T[];
  pagination?: { next_page?: string | null };
};

type CalendlyUserMe = {
  resource?: {
    current_organization?: string;
  };
};

type CalendlyEvent = {
  uri: string;
  name?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  location?: {
    type?: string;
    location?: string;
    join_url?: string;
  } | null;
  event_memberships?: Array<{
    user_name?: string;
    user_email?: string;
  }>;
};

type CalendlyInvitee = {
  uri: string;
  email?: string;
  name?: string;
  status?: string;
  cancel_url?: string;
  reschedule_url?: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
};

type CoachRow = {
  id: string;
  name: string;
};

type ScheduledCallUpsert = {
  user_id: string;
  coach_id: string | null;
  coach_name: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  status: "scheduled";
  meeting_url: string | null;
  provider: "calendly";
  provider_event_id: string;
  notes: string | null;
};

async function calendlyFetch<T>(pathOrUrl: string, token: string): Promise<T> {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${calendlyApi}${pathOrUrl}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof body?.message === "string"
        ? body.message
        : `Calendly request failed with ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

function calendlyUuid(uri: string) {
  return uri.split("/").filter(Boolean).at(-1) || uri;
}

function meetingLink(event: CalendlyEvent) {
  return event.location?.join_url || (event.location?.location?.startsWith("https://") ? event.location.location : null);
}

function normalizeEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const { client } = await requireAdmin(request);
    const token = process.env.CALENDLY_API_TOKEN;
    if (!token) throw new Error("CALENDLY_API_TOKEN is not configured in Vercel.");

    const me = await calendlyFetch<CalendlyUserMe>("/users/me", token);
    const organization = me.resource?.current_organization;
    if (!organization) throw new Error("Calendly organization was not found for this token.");

    const minStart = new Date();
    minStart.setHours(0, 0, 0, 0);
    const maxStart = new Date(minStart);
    maxStart.setDate(maxStart.getDate() + 90);

    let nextUrl: string | null =
      `${calendlyApi}/scheduled_events?organization=${encodeURIComponent(organization)}` +
      `&status=active&min_start_time=${encodeURIComponent(minStart.toISOString())}` +
      `&max_start_time=${encodeURIComponent(maxStart.toISOString())}&count=100`;

    const events: CalendlyEvent[] = [];
    while (nextUrl) {
      const page: CalendlyCollection<CalendlyEvent> = await calendlyFetch(nextUrl, token);
      events.push(...(page.collection || []));
      nextUrl = page.pagination?.next_page || null;
    }

    const inviteesByEvent = await Promise.all(
      events.map(async (event) => {
        const eventId = calendlyUuid(event.uri);
        const page: CalendlyCollection<CalendlyInvitee> = await calendlyFetch(
          `/scheduled_events/${eventId}/invitees?count=100`,
          token,
        );
        return { event, invitees: page.collection || [] };
      }),
    );

    const emails = Array.from(
      new Set(
        inviteesByEvent.flatMap(({ invitees }) =>
          invitees.map((invitee) => normalizeEmail(invitee.email)).filter(Boolean),
        ),
      ),
    );

    const [{ data: profiles, error: profilesError }, { data: coaches, error: coachesError }] =
      await Promise.all([
        emails.length
          ? client.from("profiles").select("id,email").in("email", emails)
          : Promise.resolve({ data: [] as ProfileRow[], error: null }),
        client.from("coaches").select("id,name").eq("is_active", true),
      ]);

    if (profilesError) throw profilesError;
    if (coachesError) throw coachesError;

    const profileByEmail = new Map(
      ((profiles || []) as ProfileRow[]).map((profile) => [normalizeEmail(profile.email), profile]),
    );
    const coachRows = ((coaches || []) as CoachRow[]);

    let skipped = 0;
    const rows: ScheduledCallUpsert[] = inviteesByEvent.flatMap(({ event, invitees }) => {
      const coachName = event.event_memberships?.[0]?.user_name || "Abhishek Sharma";
      const matchedCoach = coachRows.find((coach) =>
        coachName.toLowerCase().includes(coach.name.toLowerCase()) ||
        coach.name.toLowerCase().includes(coachName.toLowerCase()),
      );

      return invitees.reduce<ScheduledCallUpsert[]>((acc, invitee) => {
          if (invitee.status === "canceled") return acc;
          const profile = profileByEmail.get(normalizeEmail(invitee.email));
          if (!profile || !event.start_time) {
            skipped += 1;
            return acc;
          }
          acc.push({
            user_id: profile.id,
            coach_id: matchedCoach?.id || null,
            coach_name: matchedCoach?.name || coachName,
            title: event.name || "Consultation call",
            starts_at: event.start_time,
            ends_at: event.end_time || null,
            status: "scheduled",
            meeting_url: meetingLink(event),
            provider: "calendly",
            provider_event_id: `${calendlyUuid(event.uri)}:${normalizeEmail(invitee.email)}`,
            notes: invitee.name ? `Booked by ${invitee.name}` : null,
          });
          return acc;
        }, []);
    });

    if (rows.length) {
      const { error: upsertError } = await client
        .from("scheduled_calls")
        .upsert(rows, { onConflict: "provider,provider_event_id" });
      if (upsertError) throw upsertError;
    }

    return NextResponse.json({
      synced: rows.length,
      skipped,
      calendlyEvents: events.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calendly sync failed";
    const unauthorized = /auth|session|administrator/i.test(message);
    return NextResponse.json(
      { error: message },
      { status: unauthorized ? 401 : 500 },
    );
  }
}
