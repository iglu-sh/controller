import { z } from "zod";

import {
    adminProcedure,
    createTRPCRouter,
} from "@/server/api/trpc";
import type {xTheEverythingType} from "@/types/db";

export const admin = createTRPCRouter({
    // Returns a list of all caches with everything attached to them via joins
    getCachesPropagated: adminProcedure
        .query(({ctx}):xTheEverythingType[]=>{
            return []
        }),
});
