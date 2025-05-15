import {NextRequest, NextResponse} from "next/server";
import Database from '@/lib/db'
export async function GET(req:NextRequest){
    if(!req.headers.has("Authorization") || !req.headers.get("Authorization")){
        return new NextResponse(null, {status: 403})
    }
    // @ts-ignore
    const key = req.headers.get("Authorization").split(" ")[1]
    if(!key){
        return new NextResponse(null, {status: 403})
    }

    const db = new Database()
    let status = 200
    let body = {}
    try{
        const keysForKey = await db.getPublicSigningKeysForKey(key)
        body = {
            keys: keysForKey
        }
    }
    catch(err){
       body = {error: "Error fetching public keys"}
    }
    await db.close()
    return NextResponse.json(body, {status: 200})
}