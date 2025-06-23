import { z } from "zod";

import {
    adminProcedure,
    createTRPCRouter,
} from "@/server/api/trpc";
import type {xTheEverythingType} from "@/types/db";
import Database from "@/lib/db";
import Logger from "@iglu-sh/logger";

export const admin = createTRPCRouter({
    // Returns a list of all caches with everything attached to them via joins
    getCachesPropagated: adminProcedure
        .query(async ({ctx}):Promise<xTheEverythingType[]>=>{
            const db = new Database()
            let data:xTheEverythingType[] = []
            try{
                await db.connect()
                data = await db.getEverything();
            }
            catch(e){
                Logger.error(`Failed to connect to DB ${e}`);
            }
            return data;
        }),
});
