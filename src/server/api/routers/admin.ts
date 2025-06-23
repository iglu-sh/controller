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
        .query(async ():Promise<xTheEverythingType[]>=>{
            const db = new Database()
            let data:xTheEverythingType[] = []
            try{
                await db.connect()
                data = await db.getEverything();
            }
            catch(e){
                //eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                Logger.error(`Failed to connect to DB ${e}`);
            }
            return data;
        }),
});
