/*
* This file is responsible for creating and managing the builders
* */


/*
* A docker name is comprised of the following parts:
* iglu-builder_<builder_id>_<run_id>_<uuid>
* */

import Scheduler from './scheduler';
import {BunRequest} from "bun";
import Database from "@/lib/db";
import Docker, {ContainerInspectInfo} from "dockerode";
import {builderDatabase} from "@/types/db";
import {Logger} from "@/lib/logger";
import dockerEventCallback from "@/lib/scheduler/lib/docker/dockerEventCallback";
import event from 'events';
import {runningBuilder} from "@/types/scheduler";
import builderStartup from "@/lib/scheduler/lib/docker/builderStartup";
import end from './lib/docker/end';
import builder from "@/lib/scheduler/lib/build/builder";
import refreshQueue, {queueBuild} from "@/lib/scheduler/lib/queue";

const INTERFACE = process.env.SCHEDULER_INTERFACE
const PORT = process.env.SCHEDULER_PORT || '3000';
const KEY = process.env.SCHEDULER_AUTHKEY;
const DOCKER = new Docker({
    socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'
})
const EVENT_EMITTER = new event.EventEmitter();
const DB = new Database()
const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
const LOG_JSON = process.env.LOG_JSON === 'true' || false;

// Initialize the logger
new Logger().setLogLevel(LOG_LEVEL as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR');
new Logger().setJsonLogging(LOG_JSON);
Logger.info("Logger initialized with level: " + LOG_LEVEL);

DOCKER.info().catch((error)=>{
    console.log(error)
    Logger.error('Docker is not running or the socket path is incorrect. Please check your Docker installation and the SCHEDULER_DOCKER_SOCKET environment variable.');
    process.exit(1);
})

// Check if the iglu_nw network is already created in the Docker environment if not, create it
if(!DOCKER.getNetwork('iglu-nw')) {
    Logger.info('Creating Docker network "iglu-nw"');
    await DOCKER.createNetwork({
        Name: 'iglu-nw',
        CheckDuplicate: true,
        Driver: 'bridge',
    }).catch((error) => {
        Logger.error(`Failed to create Docker network "iglu-nw": ${error.message}`);
    });
}

//Pull the latest builder image from the Docker registry
Logger.info('Pulling the latest builder image from ghcr.io/iglu-sh/iglu-builder:latest');
const pullStream = await DOCKER.pull('ghcr.io/iglu-sh/iglu-builder:latest')
await new Promise(res => DOCKER.modem.followProgress(pullStream, res))

// Close the database connection when the process exits
process.on('beforeExit', async () => {
    Logger.info('Closing database connection...');
    await DB.close();
});

// Initialize the queue and fetch the builders from the database
let builderConfig:Array<builderDatabase> = [];
let runningBuilders: Array<runningBuilder> = []
let queue: Array<{builderID:number, runID:number}> = [];

//Listen for the builderStarted event
async function builderStartedCallback(data:{id:string, name:string}) {
    Logger.info(`Received builderStarted event for builder with ID ${data.id} and name ${data.name}`);
    const builderInfo = await builderStartup(data.id, data.name, DOCKER, DB)
        .catch((error)=>{
            Logger.error(`Failed to start builder with ID ${data.id}: ${error.message}`);
            //If there was an error during startup, we should kill the builder container
            EVENT_EMITTER.emit('builderExited', {
                id: data.id,
                runID: data.id.split("_")[2],
                reason: 'FAILED'
            })
        })
    if(!builderInfo){
        Logger.error(`Failed to start builder with ID ${data.id}`);
        return;
    }

    // Add the new builder to the running builders array
    runningBuilders.push(builderInfo)

    const RUNNING_BUILDER_INDEX = runningBuilders.findIndex(builder => builder.dockerID === data.id);
    if(RUNNING_BUILDER_INDEX === -1) {
        Logger.error(`Failed to find running builder with ID ${data.id}`);
        return;
    }

    const CONFIG_INDEX = builderConfig.findIndex(config => config.builder.id === builderInfo.id);
    if(CONFIG_INDEX === -1) {
        Logger.error(`Failed to find builder config with ID ${builderInfo.id}`);
        return;
    }

    // Emit the builderStarted event so any websocket listeners can switch to the runningBuilderObject for their listening
    EVENT_EMITTER.emit('builderStarted', {
        id: data.id,
        name: data.name,
        dockerID: builderInfo.dockerID,
        ip: builderInfo.ip,
        dbID: builderInfo.dbID,
        runningBuilderIndex: RUNNING_BUILDER_INDEX,
    })

    builder(builderConfig[CONFIG_INDEX], runningBuilders[RUNNING_BUILDER_INDEX], DB, builderExitedCallback, ()=>{EVENT_EMITTER.emit(`data${builderInfo.dbID}`)}, (status)=>{
        // Update the status of the builder in the runningBuilders array
        if(!runningBuilders[RUNNING_BUILDER_INDEX]) {
            Logger.error(`Failed to find running builder with index ${RUNNING_BUILDER_INDEX}`);
            return;
        }
        runningBuilders[RUNNING_BUILDER_INDEX].status = status as any;
    })
}

async function builderExitedCallback(data:{id:string, runID:number, reason: 'FAILED' | 'SUCCESS'}){
    Logger.info(`Received builderExited event for builder with ID ${data.id} and reason ${data.reason}`);
    EVENT_EMITTER.emit('builderExited', data);
    const BUILDER = runningBuilders.find(builder => builder.dockerID === data.id);

    await end(BUILDER, data.reason, DOCKER, DB, data.id, data.runID, removeRunningBuilder);
    EVENT_EMITTER.emit('queueRefresh');
}

//Listen for builderFailed event
/*
EVENT_EMITTER.on('builderExited', async (data:{id:string, runID:number, reason: 'FAILED' | 'SUCCESS'})=>{
    await builderExitedCallback(data);
})
*/
// Listen for queueRefresh event
EVENT_EMITTER.on('queueRefresh', async () => {
    Logger.info(`Refreshing queue with ${queue.length} queued builders and ${runningBuilders.length} running builders.`);
    queue = await refreshQueue(builderConfig, queue, runningBuilders, DB, DOCKER);
})

/*
* This function returns all the running builders
* */
function getRunningBuilders():Array<runningBuilder>{
    return runningBuilders;
}

/*
* This function removes the specified builder from the running builders array
* */
function removeRunningBuilder(dockerID:string){
    const RUNNING_BUILDER_INDEX = runningBuilders.findIndex(builder => builder.dockerID === dockerID);
    if(RUNNING_BUILDER_INDEX === -1) {
        Logger.error(`Failed to find running builder with ID ${dockerID}`);
        return;
    }
    runningBuilders.splice(RUNNING_BUILDER_INDEX, 1);
}

/*
* Function that adds a new builder to the queue and then emits the queueRefresh event
* */
async function addBuildToQueue(id:number){
    const returnObj = await queueBuild(builderConfig, queue, runningBuilders, DB, id)
    queue = returnObj.queue;
    EVENT_EMITTER.emit('queueRefresh');
    return returnObj.runID // Return the last added builder in the queue
}


// Attach to the docker events and set the callback to the dockerEventCallback Function
DOCKER.getEvents(async (err, data) => {await dockerEventCallback(err, data, getRunningBuilders, builderStartedCallback)})

// Get the initial builder configs from the database
async function initializeBuilders() {
    try {
        builderConfig = await DB.getAllBuilders()
        Logger.info(`Initialized ${builderConfig.length} builder configs, ${queue.length} queued builders, and ${runningBuilders.length} running builders.`);
    } catch (error) {
        Logger.error(`Error initializing builders: ${error}`);
    }
}
await initializeBuilders()

//await addBuildToQueue(1)
//Middleware to check if the request is authenticated
const isAuthenticated = (req:BunRequest) => {
    const authHeader = req.headers.get('Authorization');
    const authKeyURLParam = new URL(req.url).searchParams.get('authKey');
    if (!authHeader && !authKeyURLParam) return false;

    let token = authHeader ? authHeader.split(' ')[1] : authKeyURLParam;


    return token === KEY
}



Bun.serve({
    routes: {
        '/': async (req) => {
            return new Response('Scheduler is running', { status: 200 });
        },
        /*
        * API Endpoint to refresh available builders
        * */
        '/api/v1/refresh/config': async (req) => {
            if (!isAuthenticated(req)) {
                return new Response('Unauthorized', { status: 401 });
            }
            try {
                await initializeBuilders();
                return new Response('Builder config refreshed', { status: 200 });
            } catch (error) {
                console.error('Error refreshing builder config:', error);
                return new Response('Failed to refresh builder config', { status: 500 });
            }
        },
        '/api/v1/queue': async (req) => {
            if (!isAuthenticated(req)) {
                return new Response('Unauthorized', { status: 401 });
            }
            if(req.method !== 'POST'){
                return new Response('Method Not Allowed', { status: 405});
            }
            try {
                Logger.logRequest('/api/v1/queue', 'POST');

                const body = await req.json();
                if(!body.builderID){
                    return new Response('Malformed Request: builderID is required', { status: 400 });
                }

                const builderID = parseInt(body.builderID);
                if(isNaN(builderID)){
                    return new Response('Malformed Request: builderID must be a number', { status: 400 });
                }

                // Check if the builder exists in the builderConfig
                const builderConfigItem = builderConfig.find(config => config.builder.id === builderID);
                if (!builderConfigItem) {
                    return new Response(`Builder with ID ${builderID} not found`, { status: 404 });
                }
                // Add the build to the queue
                const queuedBuilder = await addBuildToQueue(builderID);
                Logger.info(`Builder with ID ${builderID} added to the queue (runID: ${queuedBuilder})`);

                return new Response(JSON.stringify({ runID: queuedBuilder }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (error) {
                console.error('Error refreshing builder config:', error);
                return new Response('Failed to start builder', { status: 500 });
            }
        },
        '/api/v1/listen': async (req, server) => {
            if (!isAuthenticated(req)) {
                console.log('Unauthorized access attempt to /api/v1/listen');
                return new Response('Unauthorized', { status: 401 });
            }
            try {
                // upgrade the request to a WebSocket
                if (server.upgrade(
                    req,
                    {
                        data:{
                            runID: new URL(req.url).searchParams.get('runID'),
                        }
                    }
                )) {
                    //return; // do not return a Response
                    return new Response('Upgrade', { status: 101, headers: { 'Upgrade': 'websocket', 'Connection': 'Upgrade' } });
                }
                return new Response("Upgrade failed", { status: 500 });
            } catch (error) {
                console.error('Error refreshing builder config:', error);
                return new Response('Failed to refresh builder config', { status: 500 });
            }
        },
    },
    websocket: {
        //TODO: Implement Websocket handling
        message(ws, message) {}, // a message is received
        open(ws) {
            async function wrap(){
                // On WebSocket open, we fetch the current output from the builder (stored in the runningBuilders array)
                // and send it to the client line by line
                Logger.info('WebSocket connection opened');
                const RUN_ID = (ws.data as any).runID

                //The first message is always the current state of the builder
                //i.e QUEUED, STARTING, RUNNING, SUCCESS, FAILED
                const BUILDER_RUN = await DB.getBuilderRun(RUN_ID).catch((err)=>{
                    Logger.error(`Error fetching builder run with ID ${RUN_ID}: ${err.message}`);
                    ws.close(1000, 'Internal Server Error');
                    return null;
                })

                if(!BUILDER_RUN) {
                    Logger.error(`Builder run with ID ${RUN_ID} not found`);
                    ws.close(1000, 'Builder run not found');
                    return;
                }

                ws.send(JSON.stringify({
                    msgType: 'initialState',
                    data: {
                        status: BUILDER_RUN ? BUILDER_RUN.status : 'UNKNOWN',
                        runID: RUN_ID,
                        started_at: BUILDER_RUN ? BUILDER_RUN.started_at : null,
                    }
                }))


                // If the state of the builder is FAILURE or SUCCESS, we send the output of the builder in the database
                let output = BUILDER_RUN.status === 'SUCCESS' ||
                    BUILDER_RUN.status === 'FAILED' ?
                        BUILDER_RUN.log :
                        ''
                let RUNNING_BUILDER = runningBuilders.find(builder => builder.dbID === RUN_ID);

                // If the RUNNING_BUILDER is found, we use its output instead
                if(RUNNING_BUILDER) {
                    output = RUNNING_BUILDER.output;
                }

                // Now we send the output line by line to the client
                if(output && output.length > 0){
                    const lines = output.split('\n');
                    for (const line of lines) {
                        if(line.trim().length > 0){
                            ws.send(JSON.stringify({
                                msgType: 'output',
                                data: line,
                            }));
                        }
                    }
                }

                // If the status is SUCCESS or FAILED, we send the final message
                if(BUILDER_RUN.status === 'SUCCESS' || BUILDER_RUN.status === 'FAILED'){
                    ws.send(JSON.stringify({
                        msgType: 'final',
                        data: {
                            status: BUILDER_RUN.status,
                            ended_at: BUILDER_RUN.ended_at,
                            runID: RUN_ID,
                            duration: BUILDER_RUN.duration
                        },
                    }));
                    ws.close(1000, 'Builder run completed');
                    return
                }


                // This function listens to the specified builderIndexes readable stream and sends the data to the client
                function msgHandler(runningBuilderIndex:number){

                    // Fetch the runningBuilder object from the runningBuilders array
                    const RUNNING_BUILDER = runningBuilders.find(builder => builder.dbID == RUN_ID);
                    if(!RUNNING_BUILDER){
                        Logger.error(`Running builder with index ${runningBuilderIndex} not found`);
                        ws.close(1000, 'Running builder not found');
                        return
                    }
                    Logger.error(`Listening to running builder with ID ${RUNNING_BUILDER.dockerID}`);
                    let oldStatus = RUNNING_BUILDER.status;
                    // If the runningBuilder has a stream, we listen to it
                    EVENT_EMITTER.on(`data${RUNNING_BUILDER.dbID}`, () => {
                        if(RUNNING_BUILDER.status !== oldStatus){
                            ws.send(JSON.stringify({
                                msgType: 'statusUpdate',
                                data: RUNNING_BUILDER.status,
                            }))
                            oldStatus = RUNNING_BUILDER.status;
                        }
                        // Get the latest line from the output string
                        const latestLine = RUNNING_BUILDER.output.split('\n').slice(-2, -1)[0]; // Get the second last line to avoid sending an empty line
                        ws.send(JSON.stringify({
                            msgType: 'output',
                            data: latestLine,
                        }));
                    })

                    // We also listen to the builderExited event to close the WebSocket connection when the builder exits
                    EVENT_EMITTER.on('builderExited', async (data:{id:string, runID:number, reason: 'FAILED' | 'SUCCESS'}) => {
                        if(data.runID != RUNNING_BUILDER.dbID) return; // Ignore events for other builders
                        Logger.debug(`Received builderExited event for runID ${data.runID} with reason ${data.reason}`);
                        // Fetch the run from the database
                        const run = await DB.getBuilderRun(RUN_ID)
                        ws.send(JSON.stringify({
                            msgType: 'final',
                            data: {
                                status: data.reason,
                                ended_at: new Date().toISOString(),
                                runID: RUNNING_BUILDER.dbID,
                                duration: run ? run.duration : 'not available',
                            },
                        }));
                        ws.close(1000, `Builder run ${data.reason}`);
                    })
                }

                // If the builder is QUEUED then there's no stream that we can listen too at the moment so we listen to the builderStarted event instead
                if(BUILDER_RUN.status === 'QUEUED'){

                    let alreadyListening = false
                    // Listen for the builderStarted event to get the runningBuilder index
                    EVENT_EMITTER.on('builderStarted', (data) => {
                        Logger.debug('Received builderStarted event in WebSocket listener');
                        if(data.runID != RUN_ID) return; // Ignore events for other builders
                        if(alreadyListening) return; // If we are already listening, we don't need to switch to the stream listener again
                        alreadyListening = true; // Set the flag to true to avoid switching again
                        const RUNNING_BUILDER_INDEX = data.runningBuilderIndex;
                        const RUNNING_BUILDER = runningBuilders.find(builder => builder.dbID == RUN_ID);
                        ws.send(JSON.stringify({
                            msgType: 'statusUpdate',
                            data: RUNNING_BUILDER ? RUNNING_BUILDER.status: 'UNKNOWN',
                        }))
                        msgHandler(RUNNING_BUILDER_INDEX);
                    });
                }
                else{
                    // If the builder is not QUEUED, we can listen to the stream directly
                    const RUNNING_BUILDER_INDEX = runningBuilders.findIndex(builder => builder.dbID == RUN_ID);
                    if(RUNNING_BUILDER_INDEX === -1){
                        Logger.error(`Running builder with runID ${RUN_ID} not found ${RUNNING_BUILDER_INDEX}`);
                        ws.close(1000, 'Running builder not found');
                        return;
                    }
                    msgHandler(RUNNING_BUILDER_INDEX);
                }
            }
            wrap()
        }, // a socket is opened
        close(ws, code, message) {

        }, // a socket is closed
    },
    port: parseInt(PORT),
    hostname: INTERFACE,
})