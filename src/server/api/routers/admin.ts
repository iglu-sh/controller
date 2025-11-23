import {
    adminProcedure,
    createTRPCRouter,
} from "@/server/api/trpc";
import type {User, uuid, xTheEverythingType} from "@iglu-sh/types/core/db";
import Database from "@/lib/db";
import Logger from "@iglu-sh/logger";
import {z} from "zod";

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
                
                Logger.error(`Failed to connect to DB ${e}`);
            }
            return data;
        }),
    addUser: adminProcedure
        .input(z.object({
            name: z.string().min(1),
            email: z.string().email(),
            isAdmin: z.boolean().default(false)
        }))
        .mutation(async ({ input}):Promise<{
            user: User,
            success: boolean
        }> => {
            const db = new Database()
            const password = Math.random().toString(36).slice(-8); // Generate a random password
            let user:User = {
                id: '' as uuid,
                username: input.name,
                email: input.email,
                is_admin: input.isAdmin,
                avatar_color: '#000000', // Default color, can be changed later
                createdAt: new Date(),
                updatedAt: new Date(),
                last_login: new Date(),
                is_verified: false,
                must_change_password: false,
                show_oob: false,
                password: password
            };
            let success = false
            try{
                await db.connect()
                // Check if the user already exists
                const existingUser = await db.getUserByNameOrEmail(input.name, input.email);
                if(existingUser){
                    throw new Error(`User with name ${input.name} or email ${input.email} already exists.`);
                }
                user = await db.createUser(
                    input.name,
                    input.email,
                    password,
                    input.isAdmin,
                    true,
                    true,
                    false
                )
                user.password = password
                success = true;
            }
            catch(e){
                
                Logger.error(`Failed to add user ${e}`);
            }
            await db.disconnect()
            return {
                user: user,
                success: success
            }
        }),
    changeAccess: adminProcedure
        .input(z.object({
            userId: z.string().uuid(),
            type: z.enum(["add", "remove"]),
            resourceType: z.enum(["cache", "apikey"]),
            resourceId: z.number()
        }))
        .mutation(async ({ input}):Promise<{
            success: boolean,
            message?: string
        }> => {
            const db = new Database()
            let success = false;
            try{
                await db.connect()
                if(input.resourceType === "cache"){
                    if(input.type === "add"){
                        // Add user to the cache
                        success = await db.addUserToCache(input.resourceId, input.userId)
                    }
                }
                if(input.resourceType === "apikey"){
                    if(input.type === "add"){
                        // Add user to the API key
                        success = await db.addUserToApiKey(input.resourceId, input.userId)
                    }
                }
                await db.disconnect()
            }
            catch(e){
                
                Logger.error(`Failed to connect to DB ${e}`);
                return {
                    success: false,
                    message: "Database connection failed."
                }
            }

            return {
                success: success,
            }
        }),
    removeOOBFlag: adminProcedure
        .input(z.string().uuid())
        .mutation(async ({ input }) => {
            const db = new Database()
            let success = false;
            Logger.debug(`Removing OOB flag for user ${input}`);
            try{
                await db.connect()
                success = await db.removeOOBFlag(input);
                await db.disconnect()
            }
            catch(e){
                Logger.error(`Failed to connect to DB ${e}`);
            }
            return {
                success: success,
            }
        })
});
