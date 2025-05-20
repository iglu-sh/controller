import {NextResponse, NextRequest} from "next/server";
import Database from '@/lib/db'
import 'dotenv/config'
import {cacheCreationObject} from "@/types/api";
export async function GET(request: NextRequest) {
  //Check if the request has an authorization bearer header
  if(!request.headers.has('authorization')) {
    return new NextResponse(null, {status: 403})
  }

  // @ts-ignore
  const key = request.headers.get('authorization').split(" ")[1]
  if(!key){
    return new NextResponse(null, {status: 403})
  }

  const db = new Database();
  let caches:{
    id: number,
    name: string,
    ispublic: boolean
  }[] = [];
  try{
    caches = await db.getCachesForKey(key)
  }
  catch(error) {
    console.error(`Error getting caches for key ${key}: ${error}`);
  }
  await db.close();
  if(!caches || caches.length === 0){
    return new NextResponse(null, {status: 403})
  }

  return NextResponse.json({
    caches: caches
  });
}

//Handle the creation of a cache
export async function POST(req: NextRequest){
  if(!req.headers.has("Authorization")){
    return NextResponse.json({error: "Unauthorized"}, {status: 401})
  }

  if(!req.headers.has("Content-Type") || req.headers.get("Content-Type") !== "application/json"){
    return NextResponse.json({error: "Invalid Content-Type"}, {status: 400})
  }
  const body:cacheCreationObject = await req.json().catch((error)=>{
    console.error(`Error parsing request body: ${error}`);
    return NextResponse.json({error: "Malformed request body"}, {status: 400});
  })

  //Check if the request has a request body and if it has all the keys
  if(!body ||
      !body.name ||
      !Object.keys(body.githubUsername) ||
      !Object.keys(body).includes("priority")||
      !body.priority ||
      !Object.keys(body).includes("enableBuilder") ||
      !body.compression ||
      !Object.keys(body).includes("publicSigningKey")
  ){
    return NextResponse.json({error: "Malformed request body"}, {status: 400})
  }

  //Regex to find and replace all the sql injection characters (will be cut from the strings)
  const regex = /[;'"\\]/g;


  //Now validate the values in the request body
  if(typeof body.name !== "string"){
    return NextResponse.json({error: "Cache name must be a string"}, {status: 400})
  }

  if(typeof body.githubUsername !== "string"){
    return NextResponse.json({error: "Github username must be a string"}, {status: 400})
  }

  if(typeof body.publicSigningKey !== "string"){
    return NextResponse.json({error: "Public signing key must be a string"}, {status: 400})
  }
  if(typeof body.isPublic !== "boolean"){
  return NextResponse.json({error: "isPublic must be a boolean"}, {status: 400})
  }

  if(typeof body.compression !== "string" || (body.compression !== "XZ" && body.compression !== "ZSTD") ){
    return NextResponse.json({error: "Compression must be either xz or zstd"}, {status: 400})
  }

  if(typeof body.priority !== "number" || body.priority < 0 || !parseInt(body.priority)){
    return NextResponse.json({error: "Priority must be a positive number"}, {status: 400})
  }

  if(typeof body.enableBuilder !== "boolean"){
    return NextResponse.json({error: "enableBuilder must be a boolean"}, {status: 400})
  }

  //Replace all the sql injection characters
  body.name = body.name.replace(regex, "")
  body.githubusername = body.githubUsername.replace(regex, "")
  body.publicSigningKey = body.publicSigningKey.replace(regex, "")

  const apiKey = req.headers.get("Authorization")?.split(" ")[1]

  //Check if the apiKey is valid and if the apiKey has at least one cache registered to it
  if(!apiKey){
      return NextResponse.json({error: "Unauthorized"}, {status: 401})
  }
  const db = new Database();
  let responseBody = {}
  let responseStatus = 201;
  try{
    //We can be reasonably sure that the apiKey is available here so casting it to string isn't a problem
    const caches = await db.getCachesForKey(apiKey as string)
    if(!caches || caches.length === 0){
      responseBody = {error: "Unauthorized"}
      responseStatus = 401
    }

    //Try and create the cache
    const cache = await db.createCache(body, apiKey)
    if(!cache){
      responseBody = {error: "Cache creation failed"}
      responseStatus = 500
    }
  }
  catch(error){
    console.log(error)
    if(error.message === "-1"){
      responseBody = {error: "Cache already exists"}
      responseStatus = 409
    }
    else{
      responseBody = {error: "Internal server error"}
      responseStatus = 500
    }
  }

  //Return 201 to indicate that the cache was created successfully
  return NextResponse.json(responseBody, {status: responseStatus})
}


//Handle the editing of a cache
export async function PATCH(req: NextRequest){

}

//Handle the deletion of a cache
export async function DELETE(req: NextRequest){
}