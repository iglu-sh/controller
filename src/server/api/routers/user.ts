import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure
} from "@/server/api/trpc";
import Database from "@/lib/db";
import Logger from "@iglu-sh/logger";


export const user = createTRPCRouter({
    mustShowOOB: protectedProcedure
        .input(z.string().uuid())
        .query(async ({ input }):Promise<boolean> => {
            const db = new Database();
            try{
                await db.connect();
                const user = await db.getUserById(input);
                await db.disconnect();
                if(!user){
                    return false;
                }
                if(!user.is_admin){
                    return false;
                }
                return user.show_oob
            }
            catch(e){

                
                Logger.error(`Failed to check if user must show OOB: ${e}`);
                await db.disconnect()
                return false
            }
        }),

});
