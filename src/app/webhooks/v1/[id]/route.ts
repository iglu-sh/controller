/*
* This file is responsible for handling webhooks for the Iglu Scheduler.
* It will enqueue a build request with the scheduler and then return a 200 OK response as well as the listen URL, where a streaming response of the build logs can be listened too.
* */

import {NextRequest, NextResponse} from "next/server";
import auth from "@/lib/middlewares/auth";
import Database from "@/lib/db";

export async function POST(req:NextRequest, {params}: {params: {id: string}}) {
    const {id} = await params;

    if(!id){
        return NextResponse.json({error: 'Unauthenticated'})
    }

    //Check if this webhook is associated with any builders in the database
    const db = new Database()
    let builderID:string | undefined = undefined
    let cache:string | undefined = undefined
    try{
        //Get the builderID and the cacheID
        let builderIDDB = await db.getBuilderConfigByWebhookURL(`/webhooks/v1/${id}`)
        if(!builderIDDB){
            return NextResponse.json({error: 'Malformed Request'}, {status: 400})
        }
        builderID = builderIDDB.id
        cache = builderIDDB.cache_id
    }
    catch(error){
        await db.close()
        console.log(error)
        return NextResponse.json({error: 'Malformed Request'}, {status: 400})
    }
    await db.close()
    if(!builderID || !cache){
        return NextResponse.json({error: 'Malformed Request'}, {status: 400})
    }

    //Check if the user is authenticated
    const isAuthenticated = await auth(req, cache)

    if(!isAuthenticated){
        return NextResponse.json({error: 'Unauthenticated'}, {status: 401})
    }

    // We currently do not need to do anything with the webhook body so we just start the build and return a 200 OK response as well as the listen URL
    const runID = await fetch(`${process.env.FRONTEND_SCHEDULER_HOST as string}/api/v1/queue`, {
        headers: {
            "authorization" : `Bearer ${process.env.SCHEDULER_AUTHKEY}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
            builderID: parseInt(builderID)
        })
    }).then((res)=>{return res})
        .catch((err)=>{
            console.log(err)
            return {ok: false}
        })

    if(!runID.ok){
        return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
    }
    //@ts-ignore
    const body = await runID.json()
    if(!body.runID){
        return NextResponse.json({error: 'Internal Server Error'}, {status: 500})
    }

    //If this is -1 then it means a builder for this build was already running and had parallelbuilds disabled
    if(body.runID === -1){
        return NextResponse.json({error: 'Already Reported'}, {status: 208})
    }

    // Return the listen URL for the build logs
    const listenURL = `${process.env.NEXT_PUBLIC_URL as string}/api/v1/builder/${body.runID}/listen`

    return NextResponse.json({
        runID: body.runID,
        listenURL: listenURL
    }, { status: 200 });
}