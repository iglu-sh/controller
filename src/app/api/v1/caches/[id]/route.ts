import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
export async function GET(request:NextRequest, { params }: { params: { id: string } }) {
    const {id} = await params;
    if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    //Check if the auth token is valid and exists
    if(!request.headers.has("Authorization") || !request.headers.get("Authorization")){
       return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const authToken = request.headers.get("Authorization");
    const apiKey = authToken.split(" ")[1];
    if(!apiKey){
        return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    //Check if the api key is valid
    const Database = new db();
    let body = {}
    let status = 200
    try {
        //Test if the api key is valid and it has access to the cache
        const cache = await Database.getCacheById(id, apiKey);
        const storageStats = await Database.getStorageStats(id, apiKey);
        const requestStats = await Database.getTrafficStats(id, apiKey)
        body = {
            cache: cache,
            storage: storageStats,
            request: requestStats
        }
        console.log("cache", cache);
    } catch (error) {
        console.log(error)
        body = { error: "Cache not found" };
        status = 404;
    }
    return NextResponse.json(body, {status: status})
}