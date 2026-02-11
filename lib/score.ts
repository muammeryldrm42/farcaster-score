export type ScoreBreakdown = {
  profile: number;
  activity: number;
  social: number;
  total: number;
  notes: string[];
};

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Heuristic score (0-100) using only free, public Hub data.
 * IMPORTANT: Hub endpoints do not return total counts; we use capped page samples.
 */
export function computeScore(params: {
  hasPfp: boolean;
  hasDisplayName: boolean;
  hasBio: boolean;
  castsSample: number; // capped sample count (pageSize)
  likesSample: number; // capped sample count (pageSize)
  followingSample: number; // capped sample count
  followersSample: number; // capped sample count
}): ScoreBreakdown {
  const notes: string[] = [];

  // A) Profile (0-20)
  let profile = 0;
  if (params.hasPfp) profile += 8;
  if (params.hasDisplayName) profile += 6;
  if (params.hasBio) profile += 6;
  if (profile < 20) notes.push("Complete your profile (pfp/display/bio) to increase score.");

  // B) Activity (0-50) - based on samples of casts + likes
  // casts: up to 35, likes: up to 15
  const castsPart = clamp(Math.round((params.castsSample / 100) * 35), 0, 35);
  const likesPart = clamp(Math.round((params.likesSample / 100) * 15), 0, 15);
  const activity = castsPart + likesPart;
  if (activity < 50) notes.push("More casting & engagement increases score (sample-based).");

  // C) Social (0-30) - based on samples of followers/following
  const followersPart = clamp(Math.round((params.followersSample / 100) * 20), 0, 20);
  const followingPart = clamp(Math.round((params.followingSample / 100) * 10), 0, 10);
  const social = followersPart + followingPart;
  if (social < 30) notes.push("More follows & followers increases score (sample-based).");

  const total = clamp(profile + activity + social, 0, 100);

  return { profile, activity, social, total, notes };
}
