/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "@/env.ts";
import Database from "@/lib/db";
import redis from "redis";
import {buildDeregisterMsg} from "@/lib/redisHelper";
import Logger from "@iglu-sh/logger";

/** @type {import("next").NextConfig} */
const config = {
    allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev', "10.0.0.72", "*"],
};
if (process.env.SKIP_ENV_VALIDATION !== 'true'){
  const db = new Database()
  void db.connect().then(async ()=>{
      await db.setupDB()
      await db.disconnect()
  })
}
export default config;
