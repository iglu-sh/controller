
import { NextResponse, NextRequest} from "next/server";
import auth from "@/lib/middlewares/auth";
import {Validator} from "jsonschema";
import {BuilderCreationRequest} from "@/types/frontend";
import Database from "@/lib/db";
import assert from "node:assert";
import generateCachixKey from "@/lib/api/generateCachixKey";
import {builder, builderDatabaseRepresenation} from "@/types/api";
import {getWebhookURLPart} from "@/lib/api/webhookURL";
import Scheduler from "@/lib/scheduler/scheduler";
import {dbBuilder} from "@/types/db";

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

    const body:BuilderCreationRequest = await request.json().catch((error)=>{
        return NextResponse.json({"error": "Malformed request body"}, {status: 400});
    })
    if(!body){
        return NextResponse.json({"error": "Malformed request body"}, {status: 400});
    }

    //Verify body of request
    const validator = new Validator();
    const schema = require("@/schema/api/builder/create.schema.json")
    const isValid = validator.validate(body, schema);
    if(!isValid.valid){
        console.error(`Invalid request body: ${JSON.stringify(isValid.errors)}`);
        return NextResponse.json({"error": "Invalid request body"}, {status: 400});
    }


    //Check if the user requested that we should setup the cachix stuff (i.e public signing keys and api keys)
    let cachixSigningKey = body.cachix.cachixSigningKey
    let cachixAPIKey = undefined;
    let cachixPublicSigningKey = body.cachix.cachixPublicSigningKey
    let apiKeyID = undefined;
    let pskID = undefined

    //@ts-ignore
    const requestKey = request.headers.get("authorization").split(" ")[1];
    if(body.cachix.mode === "auto"){
        //Create a new Public-Private Keypair for the User
        try{
            const keyPair = await generateCachixKey()
            cachixSigningKey = keyPair.private;
            cachixPublicSigningKey = keyPair.public;
        }
        catch(error){
            return NextResponse.json({"error": "Failed to generate Cachix keys"}, {status: 500});
        }
    }
    //This verifies that the user has provided a reasonable nix signing key (i.e it is a valid base64 encoded string)
    if(body.cachix.mode === "manual"){
        //Check if the user provided a cachix signing key
        if(!cachixPublicSigningKey || !cachixSigningKey){
            return NextResponse.json({"error": "Cachix signing keys are required in manual mode"}, {status: 400});
        }

        //Check the format of these strings
        //1. Check if the keys have a prefix (usually this is divided by using a : in between the prefix and the key)
        //2. Check if the key is base64 encoded
        let signingKeyToCheck = cachixSigningKey.split(":")[1] ? cachixSigningKey.split(":")[1] : cachixSigningKey;
        let publicSigningKeyToCheck = cachixPublicSigningKey.split(":")[1] ? cachixPublicSigningKey.split(":")[1] : cachixPublicSigningKey;

        assert(!signingKeyToCheck.includes(":"), "Signing key should not contain a colon");
        assert(!publicSigningKeyToCheck.includes(":"), "Public signing key should not contain a colon");

        //Check if these keys are valid base64 encoded strings
        const regex = new RegExp('(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)')

        if(!regex.test(signingKeyToCheck) || !regex.test(publicSigningKeyToCheck)){
            return NextResponse.json({"error": "Cachix signing keys are not valid base64 encoded strings"}, {status: 400});
        }
        cachixSigningKey = `tmp:${signingKeyToCheck}`.trim();
        cachixPublicSigningKey = `tmp:${publicSigningKeyToCheck}`.trim();

    }
    //At this point we should have all the signing keys we need
    assert(cachixSigningKey && cachixPublicSigningKey)

    //Check if the cachix signing keys are valid (by converting them to a buffer and then checking their length)
    //Ed25519 public keys are either 32 bytes or 44 bytes long (depending on the generation method), private keys are 64 bytes long
    if(Buffer.from(cachixSigningKey.split(":")[1], 'base64').length !== 64 || Buffer.from(cachixPublicSigningKey.split(':')[1]).length !== (32 | 44)){
        return NextResponse.json({"error": "Invalid Cachix signing keys"}, {status: 400});
    }

    //Create a new Database instance
    const db = new Database();


    //Create a new API key for this builder
    const key = Bun.randomUUIDv7()
    cachixAPIKey = key;

    //Insert the API key into the database
    try{
        apiKeyID = await db.createKey(`Builder key for ${body.name}`, `This is a managed builder key for the builder configuration: ${body.name}`, [parseInt(cacheID)], key, false)
    }
    catch(error){
        await db.close()
        console.error("Failed to create API key in database", error);
        return NextResponse.json({"error": "Failed to create API key in database"}, {status: 500});
    }

    //We should now have the API key ID and the cachix signing keys
    assert(apiKeyID && cachixAPIKey, 'API key ID and Cachix signing keys should not be null');

    //We need to append this public signing key to the database and associate it with the cache as well as the API Key ID
    try{
        //Append the key
        pskID = await db.appendPublicSigningKey(cacheID, cachixPublicSigningKey.split(":")[1], apiKeyID, `Public Signing Key for builder-configuration: ${body.name}`);
    }
    catch(error){
        await db.close();
        console.error("Failed to append the signing key to cache", error);
        return NextResponse.json({"error": "Internal Server Error"}, {status: 500});
    }

    //We should now have the public signing key ID
    assert(pskID, 'Public Signing Key ID should not be null');


    let cacheInformation = undefined;
    try{
        //Get the cache information
        cacheInformation = await db.getCacheById(cacheID, requestKey);
    }
    //An error by the getCacheById function means that the user is not authorized to access this cache, this should have been picked up by the auth middleware, but we handle it here as well
    catch(error){
        await db.close()
        console.error("Failed to get cache information from database", error);
        return NextResponse.json({"error": "Unauthorized"}, {status: 403});
    }


    //We should have the cache information now
    assert(cacheInformation, 'Cache information should not be null');

    //Sanitization of the config values
    if(!["webhook", "manual", "cron"].includes(body.build.buildTrigger)){
        await db.close();
        return(NextResponse.json({"error": "Invalid build trigger"}, {status: 400}));
    }
    if(body.build.buildTrigger === "cron" && !body.build.cron){
        await db.close();
        return NextResponse.json({"error": "Cron expression is required for cron trigger"}, {status: 400});
    }

    if(!body.git.noClone && (!body.git.url || !body.git.branch)){
        await db.close();
        return NextResponse.json({"error": "Git URL and branch are required if noClone is false"}, {status: 400});
    }
    if(body.git.requiresAuth && (!body.git.username || !body.git.token)){
        await db.close();
        return NextResponse.json({"error": "Git username and token are required if requiresAuth is true"}, {status: 400});
    }

    let returnBody = {};
    let status = 200;
    try{
        if(!body.build.substituters){
            body.build.substituters = [{
                url: "https://cache.nixos.org",
                signingKeys: ["cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="]
            }]
        }

        //Sanitize substituters
        //@ts-ignore
        body.build.substituters = body.build.substituters.map((substituter)=> {
            if(!substituter.url || !substituter.signingKeys || !Array.isArray(substituter.signingKeys)){
                return null; //Invalid substituter, we will filter it out later
            }
            //Check if the signing keys are valid base64 encoded strings
            const regex = new RegExp('(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)')
            for(const key of substituter.signingKeys){
                if(!regex.test(key)){
                    return null; //Invalid signing key, we will filter it out later
                }
            }
            return {
                url: substituter.url,
                signingKeys: substituter.signingKeys
            }
        })

        //Filter out invalid substituters
        body.build.substituters = body.build.substituters.filter((substituter) => substituter !== null);

        //Insert the builder config into the database
        const builderConfig:builderDatabaseRepresenation = {
            name: body.name,
            id: -1,
            description: body.description,
            enabled: true,
            trigger: body.build.buildTrigger,
            schedule: body.build.buildTrigger === "cron" && body.build.cron ? body.build.cron : "no-schedule",
            git: {
                noClone: body.git.noClone,
                requiresAuth: body.git.requiresAuth,
                repository: !body.git.noClone? body.git.url : "no-clone",
                branch: !body.git.noClone? body.git.branch : "no-clone",
                gitUsername: body.git.requiresAuth ? body.git.username : "no-auth",
                gitKey: body.git.requiresAuth ? body.git.token : "no-auth",
            },
            buildOptions: {
                cores: body.build.cores,
                maxJobs: body.build.maxJobs,
                parellelBuilds: body.build.parallelBuilds,
                keep_going: true,
                extraArgs: "",
                substituters: body.build.substituters.map((substituter) => {
                    return substituter.url
                }),
                trustedPublicKeys: body.build.substituters.map((substituter) => {
                    return substituter.signingKeys.join(" ");
                }),
                command: body.build.command,
                cachix: {
                    push: body.cachix.push,
                    target: cacheID,
                    apiKey: {
                        id: apiKeyID,
                        key: cachixAPIKey
                    },
                    signingKey: {
                        id: parseInt(pskID),
                        privateKey: cachixSigningKey,
                        publicKey: cachixPublicSigningKey
                    },
                    cachixPushSourceDir: body.build.outputDir
                }
            },
            //Generate a 128 character long random string for the webhook URL
            webhookURL: `/webhooks/v1/${await getWebhookURLPart()}`
        }
        builderConfig.id = await db.createBuilder(builderConfig, cacheID)
        await db.close()
        await fetch(`http://${process.env.FRONTEND_SCHEDULER_HOST}/api/v1/refresh/config`, {
            headers: {
                authorization: `Bearer ${process.env.SCHEDULER_AUTHKEY}`
            },
            method: "GET"
        })
        returnBody = {
            "message": builderConfig
        }
    }
    catch(error){
        console.error("Failed to create builder configuration", error);
        returnBody = {"error": "Failed to create builder configuration"};
        await db.close()
        status = 500;
    }
    return NextResponse.json(returnBody, {status: status});
}

// GET request to fetch all builders for a cache
export async function GET(request: NextRequest){
    const cacheID = request.nextUrl.searchParams.get("cacheID");
    if(!cacheID || isNaN(parseInt(cacheID))){
        return NextResponse.json({"error": "Invalid Request"}, {status: 400})
    }
    let isAuthenticated = await auth(request, cacheID)
    if(!isAuthenticated){
        return NextResponse.json({"error":"Forbidden"}, {status: 403});
    }

    //Create a new Database instance
    const db = new Database();

    try{
        //Get all builders for the cache
        const builders= await db.getBuildersByCacheID(cacheID);
        await db.close();
        return NextResponse.json(builders, {status: 200});
    }
    catch(error){
        console.error("Failed to get builders for cache", error);
        await db.close();
        return NextResponse.json({"error": "Internal Server Error"}, {status: 500});
    }
}

// DELETE request to delete a builder
export async function DELETE(request: NextRequest){

}