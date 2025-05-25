import {NextRequest, NextResponse} from "next/server";
import Database from "@/lib/db";

export default async function auth(req: NextRequest, cache_id:string): Promise<boolean>{
    if(!req.headers.has('authorization')){
        return false
    }

    const authHeader = req.headers.get('authorization')!;
    const token = authHeader.split(' ')[1];

    if(!token || !authHeader.includes(`Bearer`)){
        return false
    }

    const db = new Database();
    const user = await db.getUserInformation(token)
    if(!user){
        await db.close()
        return false
    }

    // Check if the user has access to the cache
    //If the cache_id is "all", then we want to check if this user has access to at least one cache
    console.log(`Checking access for user ${token} to cache ${cache_id}`);
    if(cache_id === "all"){
        const cachesForUser = await db.getCachesForKey(token);
        await db.close()
        return cachesForUser.length > 0;
    }
    const cache = await db.checkKeyForCache(cache_id, token);
    await db.close()
    return cache;
}