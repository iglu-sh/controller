import db from '@/lib/db'
import {NextRequest, NextResponse} from "next/server";
import auth from "@/lib/middlewares/auth";

export async function GET(request:NextRequest, {params}: { params: { id: string, offset:string } }) {
    //Get the cache_id from the URL
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const offset = searchParams.get('offset');
    if(!id || !offset || isNaN(Number(offset)) || (isNaN(parseInt(id)) && id !== "all")){
        return NextResponse.json({error: "Invalid Request"}, {status: 400});
    }
    try{
        let isAuthorize = await auth(request, id)
        if(!isAuthorize){
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }
    }
    catch(err){
        console.log(err);
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }
    const Database = new db();
    let body = {}
    let status = 200;
    //Get the API key from the request headers
    const apiKey = (request.headers.get('authorization') as string).split(' ')[1];
    if(!apiKey){
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }
    try{
        body = await Database.getDerivationsForCache(id, parseInt(offset), apiKey );
        if(!body){
            body = {error: "No derivations found"};
            status = 404;
        }
    }
    catch(err){
        console.log(err)
        body = {error: "Internal Server Error"};
        status = 500;
    }
    await Database.close()
    return NextResponse.json(body, {status: status})
}