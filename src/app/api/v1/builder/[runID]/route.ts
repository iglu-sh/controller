/*
* This route streams the response of a WebSocket on the Scheduler server to the client on the other side
* */


import {NextRequest, NextResponse} from "next/server";

import {Stream} from "node:stream";
import Database from "@/lib/db";
export async function GET(req:NextRequest, res:NextResponse){
    const readable = new Stream.Readable()
    readable._read = () => {}; // No-op _read function

    //Check if the connected client is allowed to receive data for the provided runID
    const db = new Database()
    try{
        
    }
    catch(err){
        await db.close()
        return NextResponse.json({error: 'Internal Server Error'}, {status: 500, statusText: 'Internal Server Error'});
    }


    readable.push('Test\n')
    setTimeout(()=>{
        readable.push("Hello, world!\n");
        readable.push(null)
    }, 5000)
    return new Response(readable)
}

export async function WS(req:NextRequest){
    return new WebSocket(req.url)
}