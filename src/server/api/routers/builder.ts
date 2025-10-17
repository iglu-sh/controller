import {
    adminProcedure,
    createTRPCRouter, protectedProcedure,
} from "@/server/api/trpc";
import type {
    User,
    uuid,
    xTheEverythingType,
    builder as builderType
} from "@iglu-sh/types/core/db";
import Database from "@/lib/db";
import Logger from "@iglu-sh/logger";
import Redis from '@/lib/redis'
import {z} from "zod";
import {builderSchema} from "@/types/schemas";
import type {combinedBuilder} from "@iglu-sh/types/core/db";
import generateCachixKey from "@/lib/generateCachixKey";
import type {NodeInfo, nodeRegistrationRequest} from "@iglu-sh/types/scheduler";
import {getRedisClient} from "@/lib/redisHelper";

export const builder = createTRPCRouter({
    // Returns a list of all caches with everything attached to them via joins
    createBuilder: protectedProcedure
        .input(builderSchema)
        .mutation(async ({ctx, input}):Promise<combinedBuilder>=>{
            const db = new Database()
            let createdBuilder:combinedBuilder;
            try{
                await db.connect()
                // Check if user is allowed to access the specified cache
                const cachesForUser = await db.getCachesByUserId(ctx.session.user.session_user.id);

                if(!cachesForUser.some(cache => cache.id === input.builder.cache_id)){
                    throw new Error(`User ${ctx.session.user.session_user.username} is not allowed to access cache with ID ${input.builder.cache_id}`);
                }
                // Create a new public-private key
                const keyPair = await generateCachixKey()

                // Create an api key to use
                const plaintextKey = crypto.randomUUID()
                const apiKey = await db.appendApiKey(
                    input.builder.cache_id,
                    plaintextKey,
                )

                // Append the signing key to cachix
                const signingKey = await db.appendPublicKey(
                    input.builder.cache_id,
                    keyPair.public,
                    plaintextKey
                )

                // Add everything to the input object
                input.cachix_config.signingkey = keyPair.private;
                input.cachix_config.apikey = plaintextKey;

                // Generate a webhook url
                input.builder.webhookURL = `/api/v1/webhooks/builder/${crypto.randomUUID()}${crypto.randomUUID()}`

                createdBuilder = await db.createBuilder(input as unknown as combinedBuilder)
            }
            catch(e){
                Logger.error(`Failed to connect to DB ${e}`);
                return Promise.reject(e as Error);
            }
            return Promise.resolve(createdBuilder);
        }),
    getAllBuilders: protectedProcedure
        .input(z.object({cache: z.number()}))
        .query(async ({ctx, input}):Promise<builderType[]>=>{
            console.log("Input:", input)
            const db = new Database()
            Logger.debug("Checking if user is allowed to access cache")
            // TODO: Validate if the user is allowed to access the cache

            Logger.debug("Fetching Builders")
            let builders:builderType[];
            try{
                await db.connect()
                builders = await db.getBuilderForCache(input.cache) as builderType[]
                await db.disconnect()
            }
            catch(e){
                Logger.error(`Failed to connect to DB ${e}`);
                await db.disconnect()
                return []
            }
            return builders;
        }),
    getRegisteredNodes: adminProcedure
        .query(async ({ctx}):Promise<NodeInfo[]>=>{
            const redis = new Redis()
            try{
                const nodes = await redis.getConnectedNodes()
                await redis.quit()
                return nodes
            }
            catch(e){
                Logger.error(`Failed to get nodes from Redis: ${e}`);
                await redis.quit()
            }
            return []
        }),
    sendTestJob: adminProcedure
        .input(z.object({builderID: z.number()}))
        .mutation(async ({ctx, input}):Promise<boolean>=>{
            const db = new Database()
            let builder:combinedBuilder;
            try{
                await db.connect()
                const builderConfig = await db.getBuilderById(input.builderID)
                if(!builderConfig){
                    throw new Error(`Builder with ID ${input.builderID} not found`)
                }
                builder = builderConfig
                await db.disconnect()
            }
            catch(e){
                Logger.error(`Failed to connect to DB ${e}`);
                await db.disconnect()
                return Promise.reject(e as Error);
            }
            return !!builder;
        })
});
