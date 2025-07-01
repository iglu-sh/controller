import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure
} from "@/server/api/trpc";
import Database from "@/lib/db";
import Logger from "@iglu-sh/logger";
import type {apiKeyWithCache, keys, User} from "@/types/db";


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
    getUser: protectedProcedure
        .query(async ({ ctx }):Promise<User> => {
            const db = new Database();
            try{
                await db.connect();
                const user = await db.getUserById(ctx.session.user.session_user.id);
                await db.disconnect();
                if(!user){
                    throw new Error("User not found");
                }
                return user;
            }
            catch(e){
                Logger.error(`Failed to get user: ${e}`);
                await db.disconnect()
                throw e;
            }
        }),
    changePassword: protectedProcedure
        .input(z.object({oldPassword: z.string(), newPassword: z.string(), repeatPassword: z.string()}))
        .mutation(async ({ input, ctx }): Promise<boolean>=>{
            const db = new Database()
            let success = false
            try{
                await db.connect()
                const auth = await db.authenticateUser(ctx.session.user.session_user.username, input.oldPassword)
                if(!auth){
                    throw new Error("Invalid current password")
                }
                if(input.newPassword !== input.repeatPassword){
                    throw new Error("New password and repeat password do not match")
                }
                if(input.newPassword.length < 8){
                    throw new Error("New password must be at least 8 characters long")
                }
                success = await db.resetPassword(ctx.session.user.session_user.id, input.newPassword)
                if(!success){
                    throw new Error("Failed to reset password")
                }
            }
            catch(e){
                Logger.error(`Failed to reset password for user: ${e}`);
                success = false
            }
            await db.disconnect()
            return success
        }),
    getApiKeys: protectedProcedure
        .query(async ({ ctx }):Promise<apiKeyWithCache[]> => {
            const db = new Database();
            try{
                await db.connect();
                const apiKeys = await db.getApiKeysByUserId(ctx.session.user.session_user.id);
                await db.disconnect();
                return apiKeys;
            }
            catch(e){
                Logger.error(`Failed to get API keys for user: ${e}`);
                await db.disconnect();
                throw e;
            }
        })
});
