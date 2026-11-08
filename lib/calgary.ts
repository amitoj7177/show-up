import snapshot from "./calgary.json";

export type Community = { code: string; name: string; area: string; lat: number; lng: number };

export const COMMUNITIES: Community[] = snapshot.communities;
export const CALGARY_DATA = { fetchedAt: snapshot.fetchedAt, sources: snapshot.sources, licence: snapshot.licence };

export function findCommunity(code: string | null | undefined): Community | undefined {
  return COMMUNITIES.find((community) => community.code === code);
}
