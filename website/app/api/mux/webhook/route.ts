import { serverSupabase } from "../../../../lib/admin-server";

type MuxEventData = {
  id?: string;
  asset_id?: string;
  passthrough?: string;
  duration?: number;
  playback_ids?: Array<{ id?: string }>;
  errors?: { messages?: string[] };
};

type MuxEvent = {
  type?: string;
  data?: MuxEventData;
};

const bytesToHex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const secureEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
};

async function validSignature(
  raw: string,
  signature: string | null,
  secret: string,
) {
  if (!signature) return false;
  const parts = Object.fromEntries(
    signature.split(",").map((part) => part.split("=", 2)),
  );
  const timestamp = Number(parts.t);
  if (
    !Number.isFinite(timestamp) ||
    !parts.v1 ||
    Math.abs(Date.now() / 1000 - timestamp) > 300
  ) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${parts.t}.${raw}`),
  );
  return secureEqual(bytesToHex(digest), parts.v1);
}

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.MUX_WEBHOOK_SECRET;

  if (
    !secret ||
    !(await validSignature(raw, request.headers.get("mux-signature"), secret))
  ) {
    return Response.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    );
  }

  let event: MuxEvent;
  try {
    event = JSON.parse(raw) as MuxEvent;
  } catch {
    return Response.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const data = event.data;
  if (!event.type || !data) {
    return Response.json(
      { error: "Incomplete webhook payload" },
      { status: 400 },
    );
  }

  const client = serverSupabase();
  let updateError: { message: string } | null = null;

  if (event.type === "video.upload.asset_created" && data.id && data.asset_id) {
    const { error } = await client
      .from("videos")
      .update({ mux_asset_id: data.asset_id, status: "processing" })
      .eq("mux_upload_id", data.id);
    updateError = error;
  } else if (
    event.type === "video.asset.ready" &&
    data.id &&
    data.passthrough
  ) {
    const playbackId = data.playback_ids?.[0]?.id;
    if (!playbackId) {
      return Response.json(
        { error: "Ready asset has no playback ID" },
        { status: 422 },
      );
    }
    const { error } = await client
      .from("videos")
      .update({
        mux_asset_id: data.id,
        mux_playback_id: playbackId,
        duration_seconds: Math.round(data.duration || 0),
        status: "ready",
        is_published: true,
        error_message: null,
      })
      .eq("id", data.passthrough);
    updateError = error;
  } else if (
    event.type === "video.asset.errored" &&
    data.id &&
    data.passthrough
  ) {
    const { error } = await client
      .from("videos")
      .update({
        mux_asset_id: data.id,
        status: "errored",
        error_message:
          data.errors?.messages?.join(" ") || "Mux processing failed",
      })
      .eq("id", data.passthrough);
    updateError = error;
  }

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ received: true });
}
