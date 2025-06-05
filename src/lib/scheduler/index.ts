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

// Close the database connection when the process exits
process.on('beforeExit', async () => {
    Logger.info('Closing database connection...');
    await DB.close();
});

// Initialize the queue and fetch the builders from the database
let builderConfig:Array<builderDatabase> = [];
let runningBuilders: Array<{
    id: number,
    dockerID: string,
    dockerInfo: ContainerInspectInfo,
    ip: string,
    dbID: number,
    output: Buffer
}> = []
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
    builder(builderConfig[CONFIG_INDEX], runningBuilders[RUNNING_BUILDER_INDEX], DB)
}

//Listen for builderFailed event
EVENT_EMITTER.on('builderExited', async (data:{id:string, runID:number, reason: 'FAILED' | 'SUCCESS'})=>{
    Logger.info(`Received builderExited event for builder with ID ${data.id} and reason ${data.reason}`);
    const BUILDER = runningBuilders.find(builder => builder.dockerID === data.id);
    await end(BUILDER, data.reason, DOCKER, DB, data.id, data.runID, removeRunningBuilder);
})

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

    queue = await queueBuild(builderConfig, queue, runningBuilders, DB, id)
    EVENT_EMITTER.emit('queueRefresh');
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


await addBuildToQueue(1)





//Middleware to check if the request is authenticated
const isAuthenticated = (req:BunRequest) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return false;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token === KEY
}



Bun.serve({
    routes: {
        '/': async (req) => {
            return new Response('Scheduler is running', { status: 200 });
        },
        '/refresh': async (req) => {
            if (!isAuthenticated(req)) {
                return new Response('Unauthorized', { status: 401 });
            }
            try {
                return new Response('Builder config refreshed', { status: 200 });
            } catch (error) {
                console.error('Error refreshing builder config:', error);
                return new Response('Failed to refresh builder config', { status: 500 });
            }
        },
    },
    port: parseInt(PORT),
    hostname: INTERFACE,
})