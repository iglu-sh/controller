import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {cache} from "@/types/api";
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

export async function PATCH(request:NextRequest, {params}: { params: { id: string } }) {
    //Check if the request is authenticated
    if(!request.headers.has("Authorization") || !request.headers.get("Authorization")){
        return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const authToken = request.headers.get("Authorization");
    if(!authToken){
        return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const apiKey = authToken.split(" ")[1];
    if(!apiKey){
        return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    //Check if the request has an id param
    const {id} = await params;
    if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    //Check if the request has a body
    const body: cache | undefined = await request.json();
    if (!body) {
        return NextResponse.json({ error: "Body is required" }, { status: 400 });
    }

    //Check if the request adheres to the cache schema
    if(
        !body.name
        || !body.id
        || !body.preferredcompressionmethod
        || !body.githubusername
        || !body.ispublic
        || !body.permission
        || (!body.publicsigningkeys && body.publicsigningkeys !== "")
        || !body.uri
        || !body.priority
    ){
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    //Check if the keys that are allowed to be changed are valid
    if(
        body.name === ""
        || body.name === undefined
        || body.name === "create"
        || body.name.includes(" ")
        || body.name.includes("/")
        || body.name.includes(".")
    ){
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    //Check if the githubusername is valid
    if(body.githubusername.includes(" ")){
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    //Check if the priority is a number
    if(isNaN(parseInt(body.priority as unknown as string)) || parseInt(body.priority as unknown as string) < 0){
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    //Check if the compression method is valid
    if(body.preferredcompressionmethod != "ZSTD" && body.preferredcompressionmethod != "XZ"){
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    if(body.id.toString() !== id){
        return NextResponse.json({ error: "ID cannot be changed" }, { status: 400 });
    }

    //Check if the api key is valid and it has access to the cache
    const Database = new db();
    let response = {}
    let status = 200
    try{
        const cache = await Database.checkKeyForCache(id, apiKey);
        if(!cache){
            throw new Error("Cache not found or no access");
        }

        //Update the cache
        await Database.updateCache(id, body);
        response = {message: "Cache updated"}
    }
    catch(err){
        if(err.message == "-1"){
            status = 409;
            response = { error: "Cache with that name already exists" };
        }
        else{
            console.log(err)
            response = { error: "Cache not found" };
            status = 404;
        }
    }

    return NextResponse.json(response, {status: status});
}