import {NextResponse, NextRequest} from "next/server";
import Database from '@/lib/db'
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
    await db.close();
  }

  return NextResponse.json({
    caches: caches
  });
}