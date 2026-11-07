import snapshot from "./calgary.json";

// Real City of Calgary open data, saved by scripts/fetch-calgary.mjs.
export type Community = { code: string; name: string; area: string; lat: number; lng: number };
export type Place = { name: string; type: string; address: string; lat: number; lng: number };

export const COMMUNITIES: Community[] = snapshot.communities;
export const CALGARY_DATA = { fetchedAt: snapshot.fetchedAt, sources: snapshot.sources, licence: snapshot.licence };

export function findCommunity(code: string | null | undefined): Community | undefined {
  return COMMUNITIES.find((community) => community.code === code);
}

// Rough distance in km. Accurate enough to pick the nearest community centre.
function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const x = (b.lng - a.lng) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180)) * 111.32;
  const y = (b.lat - a.lat) * 110.57;
  return Math.sqrt(x * x + y * y);
}

// A real public community centre or library about halfway between two partners.
export function meetSpot(codeA: string | null, codeB: string | null) {
  const a = findCommunity(codeA);
  const b = findCommunity(codeB);
  if (!a || !b) return null;
  const middle = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
  const nearest = (snapshot.places as Place[]).reduce((best, place) => (kmBetween(place, middle) < kmBetween(best, middle) ? place : best));
  return {
    name: nearest.name,
    type: nearest.type,
    address: nearest.address,
    kmApart: Math.round(kmBetween(a, b)),
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${nearest.lat},${nearest.lng}`,
    source: "City of Calgary Open Data",
  };
}
