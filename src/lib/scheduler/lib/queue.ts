import {builderDatabase} from "@/types/db";
import {runningBuilder} from "@/types/scheduler";
import Database from "@/lib/db";
import Docker from "dockerode";
import {start} from "@/lib/scheduler/lib/docker/start";
import {Logger} from "@/lib/logger";
/*
* This function is responsible for managing the queue of builders to be started.
* It checks if there is space for more builders, and if so, it starts the next builder in the queue.
* It returns a promise that resolves with the updated queue.
* @param {Array<builderDatabase>} builderConfigs - The array of builder configs to choose from
* @param {Array<{builderID:number, [runID]:number}>} queue - The current queue of builders to be started
* @param {Array<runningBuilder>} runningBuilders - The current array of running builders
* @param {Database} DB - The database instance to interact with the database
* @param {Docker} DOCKER - The Docker instance to interact with the Docker API
* @returns {Promise<Array<{builderID:number, [runID]:number}>>}
* @throws {Error} If there is an error in managing the queue or if the builder config is not found
* */
export default async function refreshQueue(
    builderConfigs:Array<builderDatabase>,
    queue: Array<{builderID:number, runID:number}>,
    runningBuilders: Array<runningBuilder>,
    DB: Database,
    DOCKER: Docker
    ):Promise<Array<{builderID:number, runID:number}>> {
    // Check how long the runningBuilders array is and if there's space for more builders
    const MAX_BUILDERS = process.env.MAX_BUILDERS ? parseInt(process.env.MAX_BUILDERS) : 5;
    if (runningBuilders.length >= MAX_BUILDERS) {
        return queue
    }
    // Check how long the queue is, if it is empty, we return the current running builders and queue
    if (queue.length === 0) {
        return queue
    }

    // Get the first item in the queue
    const nextBuilder = queue.shift();
    if (!nextBuilder) {
        return queue
    }

    // Find the builder config with the given ID
    const BUILDER_CONFIG = builderConfigs.find(config => config.builder.id === nextBuilder.builderID);
    if (!BUILDER_CONFIG) {
        throw new Error(`Builder config with ID ${nextBuilder.builderID} not found`);
    }
    await start(nextBuilder.builderID, nextBuilder.runID, builderConfigs, DOCKER);
    return queue;
}


export async function queueBuild(
    builderConfigs:Array<builderDatabase>,
    queue: Array<{builderID:number, runID:number}>,
    runningBuilders: Array<runningBuilder>,
    DB: Database,
    id:number,
):Promise<{runID:number, queue:Array<{builderID:number, runID:number}>}> {
    Logger.debug(`queueBuild: Adding builder with ID ${id} to the queue`);

    // Get the builder config of this build
    const BUILDER_CONFIG = builderConfigs.find(config => config.builder.id === id);

    if(!BUILDER_CONFIG) {
        Logger.error(`queueBuild: Builder config with ID ${id} not found`);
        throw new Error(`Builder config with ID ${id} not found`);
    }

    // If parallelBuilds is set to false, check if there is already a builder running for this config
    if (BUILDER_CONFIG && !BUILDER_CONFIG.buildoptions.parallelbuilds) {
        Logger.debug(`queueBuild: Parallel builds are disabled for builder with ID ${id}. Checking for existing builders.`);
        const existingBuilder = runningBuilders.find(builder => builder.id === id);

        const existingQueueItem = queue.find(item => item.builderID === id);
        if (existingBuilder || existingQueueItem) {
            Logger.debug(`queueBuild: A builder with ID ${id} is already running. Returning existing queue.`);
            // If there is already a builder running for this config, we return the current queue
            return {runID: -1, queue:queue};
        }
    }

    //Create a unique run ID for this build
    const runID = await DB.createBuilderRun(id, '', 'QUEUED', '');

    // Add the new builder to the queue
    queue.push({builderID: id, runID});

    // Refresh the queue to start the next builder if there is space
    return {runID: runID, queue:queue};
}