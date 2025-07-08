import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
} from "@/server/api/trpc";
import type * as dbTypes from "@/types/db";
import Database from "@/lib/db";
import Logger from "@iglu-sh/logger";
import type {cacheCreationObject} from "@/types/frontend";

export const cache = createTRPCRouter({
    byUser: protectedProcedure
        .query(async ({ctx}):Promise<dbTypes.cache[]>=>{
            // Here you would fetch the caches for the user from the database
            // For now, we will return a dummy cache
            if(!ctx.session.user){
                return []
            }
            let data = [] as dbTypes.cache[];
            const db = new Database()
            try{
                await db.connect()
                data = await db.getCachesByUserId(ctx.session.user.id)
            }
            catch(err){
                Logger.error(`Failed to connect to DB ${err}`);
            }
            await db.disconnect()
            return data;
        }),
    createCache: protectedProcedure
        .input(z.custom<cacheCreationObject>())
        .mutation(async ({ctx, input}) => {
            const db = new Database();
            try{
                await db.connect();
                const cache = await db.createCache(ctx.session.user.id, input).catch((err => {
                    Logger.error(`Failed to create cache: ${err}`);
                    throw new Error(JSON.stringify({message: "Failed to create cache", cause: "Already exists"}))
                }));
                await db.disconnect();
                console.log(cache)
                return cache;
            }
            catch(err){
                Logger.error(`Failed to create cache: ${err}`);
                await db.disconnect();
                throw new Error(err as string || "Failed to create cache");
            }
        })
});
