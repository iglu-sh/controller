import {
    adminProcedure,
    createTRPCRouter,
} from "@/server/api/trpc";
import type {User, uuid, xTheEverythingType} from "@/types/db";
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
                //eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
        .mutation(async ({ input, ctx}):Promise<{
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
                //eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                Logger.error(`Failed to add user ${e}`);
            }
            await db.disconnect()
            return {
                user: user,
                success: success
            }
        })
});
