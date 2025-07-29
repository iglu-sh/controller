import {
    adminProcedure,
    createTRPCRouter, protectedProcedure,
} from "@/server/api/trpc";
import type {User, uuid, xTheEverythingType} from "@/types/db";
import Database from "@/lib/db";
import Logger from "@iglu-sh/logger";
import {z} from "zod";
import {builderSchema} from "@/types/schemas";
import type {combinedBuilder} from "@iglu-sh/types/core/db";
import generateCachixKey from "@/lib/generateCachixKey";

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

                createdBuilder = await db.createBuilder(input as combinedBuilder)
            }
            catch(e){
                Logger.error(`Failed to connect to DB ${e}`);
                return Promise.reject(e as Error);
            }
            return Promise.resolve(createdBuilder);
        }),
});
