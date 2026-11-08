import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const db = await PGlite.create();
const server = new PGLiteSocketServer({ db, port: 55432, host: "127.0.0.1", maxConnections: 10 });
await server.start();
console.log("Test database ready. Everything in it disappears when you stop this.");
console.log('DATABASE_URL="postgres://postgres:postgres@127.0.0.1:55432/postgres?sslmode=disable"');
