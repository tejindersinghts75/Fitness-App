import { requireAdmin } from "../../../../lib/admin-server";

export async function POST(request: Request) {
  try {
    const { client } = await requireAdmin(request);
    const { videoId, origin } = await request.json() as { videoId?: string; origin?: string };
    if (!videoId) return Response.json({ error: "Video ID is required" }, { status: 400 });
    const { data: video } = await client.from("videos").select("id").eq("id", videoId).maybeSingle();
    if (!video) return Response.json({ error: "Video not found" }, { status: 404 });
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;
    if (!tokenId || !tokenSecret) return Response.json({ error: "Mux credentials are not configured" }, { status: 503 });
    const muxResponse = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: { "Authorization": `Basic ${btoa(`${tokenId}:${tokenSecret}`)}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cors_origin: origin || "*", new_asset_settings: { playback_policies: ["public"], video_quality: "basic", passthrough: videoId } }),
    });
    const payload = await muxResponse.json() as { data?: { id: string; url: string }; error?: { message?: string } };
    if (!muxResponse.ok || !payload.data) return Response.json({ error: payload.error?.message || "Mux could not create an upload" }, { status: 502 });
    await client.from("videos").update({ mux_upload_id: payload.data.id, status: "waiting" }).eq("id", videoId);
    return Response.json({ uploadId: payload.data.id, uploadUrl: payload.data.url });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload request failed" }, { status: 401 });
  }
}
