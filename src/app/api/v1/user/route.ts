import {NextRequest, NextResponse} from "next/server";
import Database from '@/lib/db'
export async function GET(request:NextRequest){
    if(!request.headers.get("Authorization")){
        return NextResponse.json({error: "Missing Authorization header"}, {status: 401})
    }
    if(!request.headers.get("Authorization").startsWith("Bearer ")){
        return NextResponse.json({error: "Invalid Authorization header"}, {status: 401})
    }

    const token = request.headers.get("Authorization").split(" ")[1]
    if(!token){
        return NextResponse.json({error: "Missing token"}, {status: 401})
    }

    //Replace all the sql injection characters
    const regex = /['";]/g;
    const sanitizedToken = token.replace(regex, "");
    if(sanitizedToken !== token){
        return NextResponse.json({error: "Invalid token"}, {status: 401})
    }
    const db = new Database()
    let response = {}
    let status = 200
    try{
        response = await db.getUserInformation(token)
        if(!response){
            status = 401
            response = {error: "Invalid token"}
        }
    }
    catch (e){
        console.error(e)
        status = 500
        response = {error: "Internal server error"}
    }

    await db.close()

    return NextResponse.json(response, {status: status})
}