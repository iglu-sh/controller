import {NextRequest, NextResponse} from "next/server";
import Database from "@/lib/db";
import auth from "@/lib/middlewares/auth";


export async function GET(request:NextRequest, {params}: {params: {builderID: string}}) {
    const { builderID } = await params;
    // Get the API Key from the request headers
    if(!request.headers.get("Authorization")){
        return new Response(JSON.stringify({error: "Unauthorized"}), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    const apiKey = request.headers.get("Authorization")?.split(" ")[1]
    if(!apiKey){
        return new Response(JSON.stringify({error: "Unauthorized"}), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    // Fetch the builder configuration from the database
    const db = new Database()
    const builderConfig = await db.getBuilderByID(builderID)
        .catch((err)=>{
            console.log(err)
            return undefined
        })
    if(!builderConfig){
        return new Response(JSON.stringify({error: "Unauthorized"}), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    await db.close()

    // Check if the API key is valid
    const isAuthenticated = await auth(request, builderConfig.cache.id.toString())
    if(!isAuthenticated){
        return new Response(JSON.stringify({error: "Unauthorized"}), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    // Return the builder configuration
    return NextResponse.json(builderConfig, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    })
}