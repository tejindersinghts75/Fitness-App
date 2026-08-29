import { serverSupabase } from "../../../../lib/admin-server";

const bytesToHex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, "0")).join("");
async function validSignature(raw: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const parts = Object.fromEntries(signature.split(",").map(part => part.split("=", 2)));
  if (!parts.t || !parts.v1 || Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${parts.t}.${raw}`));
  return bytesToHex(digest) === parts.v1;
}

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret || !(await validSignature(raw, request.headers.get("mux-signature"), secret))) return Response.json({ error: "Invalid webhook signature" }, { status: 401 });
  const event = JSON.parse(raw) as { type: string; data: Record<string, any> };
  const client = serverSupabase();
  const data = event.data;
  if (event.type === "video.upload.asset_created") {
    await client.from("videos").update({ mux_asset_id: data.asset_id, status: "processing" }).eq("mux_upload_id", data.id);
  } else if (event.type === "video.asset.ready") {
    const playbackId = data.playback_ids?.[0]?.id;
    await client.from("videos").update({ mux_asset_id: data.id, mux_playback_id: playbackId, duration_seconds: Math.round(data.duration || 0), status: "ready", is_published: true, error_message: null }).eq("id", data.passthrough);
  } else if (event.type === "video.asset.errored") {
    await client.from("videos").update({ mux_asset_id: data.id, status: "errored", error_message: data.errors?.messages?.join(" ") || "Mux processing failed" }).eq("id", data.passthrough);
  }
  return Response.json({ received: true });
}
