// Creates a clinic or campus group, and prints its join code and staff key once.
// Run with: npm run group:create -- "Demo Physio Clinic"
import { createHash, randomBytes } from "node:crypto";
import pg from "pg";

const name = process.argv[2];
if (!name) {
  console.error('Give the clinic a name, like: npm run group:create -- "Demo Physio Clinic"');
  process.exit(1);
}

// Codes leave out letters that look alike, such as O and 0, so they're easy to read out loud.
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const joinCode = Array.from(randomBytes(6), (byte) => LETTERS[byte % LETTERS.length]).join("");
const staffKey = randomBytes(18).toString("base64url");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query("INSERT INTO groups (name, join_code, staff_key_hash) VALUES ($1, $2, $3)", [
  name,
  joinCode,
  createHash("sha256").update(staffKey).digest("hex"),
]);
await client.end();

console.log(`Created "${name}".`);
console.log(`Join code for patients or students: ${joinCode}`);
console.log(`Staff key (keep it private, it can't be shown again): ${staffKey}`);
