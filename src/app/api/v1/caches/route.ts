import {NextResponse, NextRequest} from "next/server";
import Database from '@/lib/db'
import 'dotenv/config'
export async function GET(request: NextRequest) {
  //Check if the request has an authorization bearer header
  if(!request.headers.has('authorization')) {
    return new NextResponse(null, {status: 403})
  }

  // @ts-ignore
  const key = request.headers.get('authorization').split(" ")[1]
  console.log(key)
  if(!key){
    return new NextResponse(null, {status: 403})
  }

  const db = new Database();
  console.log(key)
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