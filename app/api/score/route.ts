import { NextResponse } from "next/server";
import { computeScore } from "@/lib/score";

const HUB = process.env.HUB_HTTP_URL || "https://hub.pinata.cloud";

type CacheEntry = { at: number; value: any };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const cache = new Map<string, CacheEntry>();

async function getJson(url: string) {
  const res = await fetch(url, {
    // cache at edge/CDN ok; our own cache is additional
    next: { revalidate: 300 },
    headers: { "accept": "application/json" },
  });
  if (!res.ok) throw new Error(`Hub error ${res.status} for ${url}`);
  return res.json();
}

function extractUserData(messages: any[]) {
  // Hub userData messages contain data.userDataBody (depends on serialization)
  // We handle a few shapes.
  const out: Record<string, string> = {};
  for (const m of messages || []) {
    const body =
      m?.data?.userDataBody ||
      m?.data?.user_data_body ||
      m?.data?.body?.userDataBody ||
      m?.data?.body?.user_data_body;
    const type =
      body?.type ??
      body?.userDataType ??
      body?.user_data_type ??
      body?.user_data_type;
    const value = body?.value;
    if (!type || typeof value !== "string") continue;
    out[String(type)] = value;
  }
  return out;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fidRaw = searchParams.get("fid");
  if (!fidRaw) return NextResponse.json({ error: "Missing fid" }, { status: 400 });

  const fid = Number(fidRaw);
  if (!Number.isFinite(fid) || fid <= 0) return NextResponse.json({ error: "Invalid fid" }, { status: 400 });

  const cacheKey = `fid:${fid}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && now - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.value, { headers: { "Cache-Control": "public, max-age=60" } });
  }

  try {
    const pageSize = 100;

    const [casts, likes, following, followers, userData] = await Promise.all([
      getJson(`${HUB}/v1/castsByFid?fid=${fid}&pageSize=${pageSize}`),
      getJson(`${HUB}/v1/reactionsByFid?fid=${fid}&reaction_type=like&pageSize=${pageSize}`).catch(() => ({ messages: [] })),
      getJson(`${HUB}/v1/linksByFid?fid=${fid}&link_type=follow&pageSize=${pageSize}`).catch(() => ({ messages: [] })),
      getJson(`${HUB}/v1/linksByTargetFid?target_fid=${fid}&link_type=follow&pageSize=${pageSize}`).catch(() => ({ messages: [] })),
      getJson(`${HUB}/v1/userDataByFid?fid=${fid}`).catch(() => ({ messages: [] })),
    ]);

    const user = extractUserData(userData?.messages || []);
    // Farcaster user data types can vary; we just look for likely values.
    const pfp = user["USER_DATA_TYPE_PFP"] || user["6"] || user["pfp"] || "";
    const display = user["USER_DATA_TYPE_DISPLAY"] || user["2"] || user["display"] || "";
    const bio = user["USER_DATA_TYPE_BIO"] || user["3"] || user["bio"] || "";
    const fname = user["USER_DATA_TYPE_FNAME"] || user["1"] || user["fname"] || user["username"] || "";

    const breakdown = computeScore({
      hasPfp: Boolean(pfp),
      hasDisplayName: Boolean(display || fname),
      hasBio: Boolean(bio),
      castsSample: (casts?.messages || []).length,
      likesSample: (likes?.messages || []).length,
      followingSample: (following?.messages || []).length,
      followersSample: (followers?.messages || []).length,
    });

    const payload = {
      fid,
      profile: {
        username: fname || null,
        displayName: display || null,
        bio: bio || null,
        pfpUrl: pfp || null,
      },
      samples: {
        casts: (casts?.messages || []).length,
        likes: (likes?.messages || []).length,
        following: (following?.messages || []).length,
        followers: (followers?.messages || []).length,
        pageSize,
      },
      breakdown,
      source: {
        hub: HUB,
        note: "Counts are sample-based (Hub APIs are paginated without totals).",
      },
    };

    cache.set(cacheKey, { at: now, value: payload });
    return NextResponse.json(payload, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to compute score", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
