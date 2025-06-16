import { createServer } from "http";
import { parse } from "url";
import next from "next";
import {getWebhookURLPart} from "@/lib/api/webhookURL";
import db from "@/lib/db";

const port = parseInt(process.env.PORT || "3001", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

process.env.SCHEDULER_INTERFACE = process.env.SCHEDULER_INTERFACE || "localhost";
process.env.SCHEDULER_PORT = process.env.SCHEDULER_PORT || "3002";
process.env.SCHEDULER_AUTHKEY = process.env.SCHEDULER_AUTHKEY || await getWebhookURLPart();
process.env.FRONTEND_SCHEDULER_HOST = `${process.env.SCHEDULER_INTERFACE}:${process.env.SCHEDULER_PORT}`;
// Try to create the frontend tables
const Database = new db()
await Database.createFrontendTables().catch((err) => {
    console.error("Error creating frontend tables:", err);
    process.exit(1)
});
await Database.close()

Bun.spawn(["bun", "run", "src/lib/scheduler/index.ts"], {
    stdout: "inherit",
    env: {
        ...process.env
    }
})
console.log('Starting next.js server...');
app.prepare().then(() => {
    createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    }).listen(port );
    console.log(
        `> Server listening at http://localhost:${port} as ${
            dev ? "development" : process.env.NODE_ENV
        }`,
    );
});