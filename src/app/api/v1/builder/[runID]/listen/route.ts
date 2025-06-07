/*
* This route streams the response of a WebSocket on the Scheduler server to the client on the other side
* */


import {NextRequest, NextResponse} from "next/server";

import {Stream} from "node:stream";
import Database from "@/lib/db";
import auth from "@/lib/middlewares/auth";
export async function GET(req:NextRequest, {params}:{params:{runID:string}}){
    const {runID} = await params;

    if(!runID || isNaN(parseInt(runID))){
        return NextResponse.json({error: 'Malformed Request'}, {status: 400, statusText: 'Malformed Request'});
    }

    // Get the run from the database
    let db = new Database();
    try{
        let run = await db.getBuilderRun(runID);
        if(!run){
            throw new Error("Not found")
        }

        // Get the builder config for this run
        let builderConfig = await db.getAllBuilders()
        const builder = builderConfig.find((b) => b.builder.id === run.builder_id);
        if(!builder){
            throw new Error("Builder not found")
        }

        //Check if the client is allowed to access this run
        const isAuthorized = await auth(req, builder.cache.id.toString())
        if(!isAuthorized){
            throw new Error("Not authorized")
        }
    }
    catch(err){
        return NextResponse.json({error: 'Malformed Request'}, {status: 400, statusText: 'Malformed Request'});
    }
    finally{
        await db.close();
    }

    const readable = new Stream.Readable()
    readable._read = () => {}; // No-op _read function

    //Check if the connected client is allowed to receive data for the provided runID
    try{
       const ws = new WebSocket(`ws://${process.env.FRONTEND_SCHEDULER_HOST}/api/v1/listen?runID=${runID}&authKey=${process.env.SCHEDULER_AUTHKEY}`);
       let isFinished = false
        ws.onmessage = ((event)=>{
            console.log('Received message from WebSocket:', event.data);

            const data = event.data;
            if (data) {
                readable.push(`${data}\n`);
            }
            if(JSON.parse(data).msgType === 'final'){
                console.log('Final message received, closing stream');
                isFinished = true
            }
        })
        ws.onopen = () => {
            console.log(`WebSocket connection established for runID ${runID}`);
        }
        ws.onerror = ((event)=>{
            console.log(event)
        })
        ws.onclose = async (event) => {
            console.log(`WebSocket connection closed for runID ${runID}:`, event.reason, event.code);
            //We wait for 400ms to ensure that the last messages are pushed to the stream
            await new Promise(resolve => setTimeout(()=>{readable.push(null)}, 400));
        }
    }
    catch(err){
        return NextResponse.json({error: 'Internal Server Error'}, {status: 500, statusText: 'Internal Server Error'});
    }

    //@ts-ignore
    return new Response(readable, {
        headers: {
            'Content-Type': 'text/stream',
            'Connection': 'keep-alive',
        },
        status: 200
    });
}

export async function WS(req:NextRequest){
    return new WebSocket(req.url)
}