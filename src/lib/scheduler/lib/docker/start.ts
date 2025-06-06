import {builderDatabase} from "@/types/db";
import Docker from "dockerode";
import {Logger} from "@/lib/logger";

/*
* This file is responsible for starting the Docker container for a given builder config id
* It **just** starts up the docker and sets things like IP address etc. All other startup tasks are handled in the builderStartup function
* @param {number} builderConfigID - The ID of the builder config to start
* @param {number} run_ID - The ID of the run in the database
* @param {Array<builderDatabase>} builderConfigs - The array of builder configs to choose from
* @param {Docker} DOCKER - The Docker instance to interact with the Docker API
* @param {Function} appendRunningBuilders - A function to append the running builders to the runningBuilders array
* @return {Promise<void>}
* @throws {Error} If there is an error in starting the Docker container or if the builder config is not found
* */
export async function start(builderConfigID:number, run_ID:number, builderConfigs:Array<builderDatabase>, DOCKER:Docker){
    // Find the builder config with the given ID
    const BUILDER_CONFIG = builderConfigs.find(config => config.builder.id === builderConfigID);
    if(!BUILDER_CONFIG){
        throw new Error(`Builder config with ID ${builderConfigID} not found`);
    }

    // Create a unique Docker container name using the builder config ID and run ID
    const CONTAINER_NAME = `iglu-builder_${builderConfigID}_${run_ID}_${Bun.randomUUIDv7()}`;

    // Create the Docker container with the specified configuration
    //FIXME: This might be a good place create a WritableStream to capture the output of the Docker container and then deprecate the whole websocket output thing
    DOCKER.run(`ghcr.io/iglu-sh/iglu-builder:latest`, [], [], {Tty: false, name: CONTAINER_NAME, HostConfig:{NetworkMode:'iglu-nw'}}, async (err)=>{
        if(err){
            Logger.error(`Error starting Docker container for builder config ID ${builderConfigID}: ${err.message}`);
            throw new Error(`Error starting Docker container for builder config ID ${builderConfigID}: ${err.message}`);
        }
    })
}