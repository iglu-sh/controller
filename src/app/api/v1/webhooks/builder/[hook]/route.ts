import {NextRequest, NextResponse} from "next/server";

export async function GET(request:NextRequest, {params}:{params:{hook:string}}){
    const {hook} = params
    return NextResponse.json({
        'hook': hook
    })
}