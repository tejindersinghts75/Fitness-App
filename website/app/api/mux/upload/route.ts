import { requireAdmin } from "../../../../lib/admin-server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type UploadRequest = {
  videoId?: unknown;
};

type MuxUploadResponse = {
  data?: { id: string; url: string };
  error?: { message?: string };
};

export async function POST(request: Request) {
  try {
    const { client } = await requireAdmin(request);
    const body = (await request.json()) as UploadRequest;
    const videoId = typeof body.videoId === "string" ? body.videoId : "";

    if (!UUID_PATTERN.test(videoId)) {
      return Response.json(
        { error: "A valid video ID is required" },
        { status: 400 },
      );
    }

    const { data: video, error: videoError } = await client
      .from("videos")
      .select("id")
      .eq("id", videoId)
      .maybeSingle();

    if (videoError) throw videoError;
    if (!video)
      return Response.json({ error: "Video not found" }, { status: 404 });

    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;
    if (!tokenId || !tokenSecret) {
      return Response.json(
        { error: "Mux credentials are not configured" },
        { status: 503 },
      );
    }

    const muxResponse = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${tokenId}:${tokenSecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cors_origin: new URL(request.url).origin,
        new_asset_settings: {
          playback_policies: ["public"],
          video_quality: "basic",
          passthrough: videoId,
        },
      }),
    });

    const payload = (await muxResponse.json()) as MuxUploadResponse;
    if (!muxResponse.ok || !payload.data) {
      return Response.json(
        { error: payload.error?.message || "Mux could not create an upload" },
        { status: 502 },
      );
    }

    const { error: updateError } = await client
      .from("videos")
      .update({ mux_upload_id: payload.data.id, status: "waiting" })
      .eq("id", videoId);
    if (updateError) throw updateError;

    return Response.json({
      uploadId: payload.data.id,
      uploadUrl: payload.data.url,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload request failed";
    const status = /authentication|session|administrator/i.test(message)
      ? 401
      : 500;
    return Response.json({ error: message }, { status });
  }
}
