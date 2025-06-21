import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/server/api/trpc";

let post = {
    id: 1,
    name: "Hello World",
};

export const cache = createTRPCRouter({
    byUser: protectedProcedure
        .query(({ctx})=>{
            // Here you would fetch the caches for the user from the database
            // For now, we will return a dummy cache
            if(!ctx.session.user){
                return []
            }
            console.log(ctx.session.user.session_user.id)
            return [
                { id: "1", name: "Cache 1", description: "This is a test cache" },
                { id: "2", name: "Cache 2", description: "This is another test cache" },
            ];
        }),
    create: protectedProcedure
        .input(z.object({ name: z.string().min(1) }))
        .mutation(async ({ input }) => {
            post = { id: post.id + 1, name: input.name };
            return post;
        }),

    getLatest: protectedProcedure.query(() => {
        return post;
    }),

    getSecretMessage: protectedProcedure.query(() => {
        return "you can now see this secret message!";
    }),
});
