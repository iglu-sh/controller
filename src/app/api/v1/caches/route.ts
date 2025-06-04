import {NextResponse, NextRequest} from "next/server";
import Database from '@/lib/db'
import 'dotenv/config'
import {cacheCreationObject} from "@/types/api";
import {Validator} from "jsonschema";
import {CacheCreationRequest} from "@/types/frontend";
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
  const body:CacheCreationRequest = await req.json().catch((error)=>{
    console.error(`Error parsing request body: ${error}`);
    return NextResponse.json({error: "Malformed request body"}, {status: 400});
  })

  if(!body){
    return NextResponse.json({error: "Malformed request body"}, {status: 400})
  }

  //Validate the body against the schema
  const schema = require('@/schema/api/cache/create.schema.json')
  if(!schema){
    console.error("Schema not found for cache creation");
    return NextResponse.json({error: "Internal server error"}, {status: 500})
  }

  const validator = new Validator();
  const validationResult = validator.validate(body, schema);
  if(!validationResult.valid){
      console.error(`Validation failed for cache creation request: ${validationResult.errors}`);
      return NextResponse.json({error: "Invalid request body"}, {status: 400})
  }

  //Regex to find and replace all the sql injection characters (will be cut from the strings)
  const regex = /[;'"\\]/g;


  //Replace all the sql injection characters
  body.name = body.name.replace(regex, "")
  body.githubUsername = body.githubUsername.replace(regex, "")

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
  catch(error:any){
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