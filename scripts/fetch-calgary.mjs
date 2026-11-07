// Saves a snapshot of real City of Calgary open data into lib/calgary.json.
// Run with: npm run calgary:fetch
// Communities: https://data.calgary.ca/resource/surr-xmvs (Community District Boundaries)
// Places to meet: https://data.calgary.ca/resource/x34e-bcjz (Community Services)
import { writeFileSync } from "node:fs";

const BASE = "https://data.calgary.ca/resource";

async function get(path) {
  const response = await fetch(`${BASE}/${path}`);
  if (!response.ok) throw new Error(`City of Calgary data returned ${response.status} for ${path}`);
  return response.json();
}

// The middle of a community, roughly: the average of its outline's points.
function middleOf(multipolygon) {
  const points = multipolygon.coordinates.flatMap((polygon) => polygon[0]);
  const lng = points.reduce((sum, [x]) => sum + x, 0) / points.length;
  const lat = points.reduce((sum, [, y]) => sum + y, 0) / points.length;
  return { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) };
}

const QUADRANTS = { NORTHWEST: "NW", NORTHEAST: "NE", SOUTHWEST: "SW", SOUTHEAST: "SE", NORTH: "N", SOUTH: "S", EAST: "E", WEST: "W", CENTRE: "Centre" };
const titleCase = (text) =>
  text
    .toLowerCase()
    .replace(/(^|[\s\-/(])\S/g, (match) => match.toUpperCase())
    .replace(/\b(Nw|Ne|Sw|Se)\b/g, (match) => match.toUpperCase());

const communityRows = await get("surr-xmvs.json?$select=name,comm_code,sector,class,multipolygon&$where=class='Residential'&$limit=1000");
const communities = communityRows
  .filter((row) => row.multipolygon && row.sector)
  .map((row) => ({ code: row.comm_code, name: titleCase(row.name), area: QUADRANTS[row.sector] ?? titleCase(row.sector), ...middleOf(row.multipolygon) }))
  .sort((a, b) => a.name.localeCompare(b.name));

const placeRows = await get("x34e-bcjz.json?$select=type,name,address,comm_code,point&$where=type in('Community Centre','Library')&$limit=1000");
const places = placeRows
  .filter((row) => row.point)
  .map((row) => ({
    name: row.name,
    type: row.type,
    address: titleCase(row.address ?? ""),
    lat: Number(row.point.coordinates[1].toFixed(5)),
    lng: Number(row.point.coordinates[0].toFixed(5)),
  }));

const snapshot = {
  fetchedAt: new Date().toISOString(),
  sources: [
    { name: "City of Calgary: Community District Boundaries", url: "https://data.calgary.ca/d/surr-xmvs" },
    { name: "City of Calgary: Community Services", url: "https://data.calgary.ca/d/x34e-bcjz" },
  ],
  licence: "Open Government Licence - City of Calgary",
  communities,
  places,
};
writeFileSync(new URL("../lib/calgary.json", import.meta.url), JSON.stringify(snapshot));
console.log(`Saved ${communities.length} communities and ${places.length} community centres and libraries.`);
