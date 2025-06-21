/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "@/env.ts";
import Database from "@/lib/db";

/** @type {import("next").NextConfig} */
const config = {};
const db = new Database()
db.connect().then(async ()=>{
    await db.setupDB()
    await db.disconnect()
})
export default config;
