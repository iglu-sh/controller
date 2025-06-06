import {runningBuilder} from "@/types/scheduler";
import Docker, {ContainerInspectInfo} from 'dockerode'
import Database from "@/lib/db";
import {Logger} from "@/lib/logger";
import stream from 'node:stream'

/*
* This function is run whenever a new builder is started. It returns a promise that resolves when the builder is successfully started (i.e /api/v1/healthcheck returns 200).
* It returns a promise with a running builder object which is supposed to be added to the runningBuilders array.
* @param {string} dockerID - The Docker ID of the builder container
* @param {string} name - The name of the builder
* @param {Docker} DOCKER - The Docker instance to interact with the Docker API
* @returns {Promise<runningBuilder>}
* @throws {Error} If there is an error in the builder startup process or if the builder fails to start
* */
export default async function builderStartup(dockerID: string, name: string, DOCKER: Docker, DB: Database):Promise<runningBuilder> {

    //Fetch the container info from Docker
    const CONTAINER_INFO:ContainerInspectInfo = await DOCKER.getContainer(dockerID).inspect();

    if (!CONTAINER_INFO || !CONTAINER_INFO.State || !CONTAINER_INFO.State.Running) {
        throw new Error(`Builder ${name} with ID ${dockerID} is not running`);
    }

    if(!CONTAINER_INFO.NetworkSettings || !CONTAINER_INFO.NetworkSettings.Networks['iglu-nw']){
        throw new Error(`Builder ${name} with ID ${dockerID} is not connected to the iglu-nw network`);
    }

    // Extract the IP address from the container info
    const IP = CONTAINER_INFO.NetworkSettings.Networks['iglu-nw'].IPAddress;

    const BUILDER_DATABASE_RUN_ID = parseInt(name.split('_')[2])

    const BUILDER_CONFIG_ID = parseInt(name.split('_')[1]);

    if(!BUILDER_DATABASE_RUN_ID || isNaN(BUILDER_DATABASE_RUN_ID)) {
        throw new Error(`Builder ${name} with ID ${dockerID} does not have a valid run ID`);
    }

    // Check if the container is up
    Logger.debug(`Checking if builder ${name} with ID ${dockerID} is up...`);
    for(let i = 0; i < 10; i++) {
        const response = await fetch(`http://${IP}:3000/api/v1/healthcheck`, {
            method: 'GET'
        }).catch((err)=>{
            return {ok: false}
        })
        if(response.ok) {
            Logger.debug(`Builder ${name} with ID ${dockerID} is up and running (took ${i + 1} attempts)`);
            break;
        }
        else if(!response.ok && i === 9) {
            throw new Error(`Builder ${name} with ID ${dockerID} failed to start after 10 attempts`);
        }
        else{
            Logger.debug(`Waiting for builder ${name} with ID ${dockerID} to start... Attempt ${i + 1}/10`);
        }

        // Wait for 1 second before the next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update the database with the new builder information (i.e transitioning the builder to the STARTING state)
    await DB.updateBuilderRun(BUILDER_DATABASE_RUN_ID, 'STARTING', '' );

    // Create the running builder object
    return({
        id: BUILDER_CONFIG_ID,
        dockerID: dockerID,
        dockerInfo: CONTAINER_INFO,
        ip: IP,
        dbID: BUILDER_DATABASE_RUN_ID,
        output: `Starting build for builder ${name} with ID ${dockerID}\n`,
        stream: new stream.Readable({
            read(){
                this.push(`Starting build for builder ${name} with ID ${dockerID}\n`);
            }
        })
    })
}