import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/server/api/trpc";

export const users = createTRPCRouter({
    getInfo: protectedProcedure
        .query(({ctx})=>{
        }),
});
