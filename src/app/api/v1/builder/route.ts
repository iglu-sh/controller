import { NextResponse, NextRequest} from "next/server";
import auth from "@/lib/middlewares/auth";


export async function POST(request: NextRequest){
    //Check if evertyhing is present
    const cacheID = request.nextUrl.searchParams.get("cacheID");
    if(!cacheID || isNaN(parseInt(cacheID))){
        return NextResponse.json({"error": "Invalid Request"}, {status: 401})
    }
    let isAuthenticated = await auth(request, cacheID)
    if(!isAuthenticated){
        return NextResponse.json({"error":"Forbidden"}, {status: 403})
    }

    //Verify body of request
    const keysToCheck = [
        {
            key: "name",
            type: "string"
        },
        {
            key: "description",
            type: "string"
        },
        {
            key: "repository",
            type: "string"
        },
        {
            key: "branch",
            type: "string"
        },
        {
            key:"gitUsername",
            type: "string"
        },
        {
            key:"gitKey",
            type: "string"
        },
        {
            key:"trigger",
            type: "string"
        },
        {
            key: "schedule",
            type: "string"
        }
    ]
}