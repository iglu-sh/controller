import { Logger } from "@/lib/logger";
import {builderDatabase} from "@/types/db";
import {runningBuilder} from "@/types/scheduler";
import event from 'node:events'
import Database from "@/lib/db";
import * as fs from "node:fs";
/*
* This function handles communication with the builder.
* It is provided with a builder configuration and the runningBuilder object to start interfacing with the container
* @param {builderDatabase} config - The builder configuration object
* @param {runningBuilder} runningBuilder - The running builder object
* @returns {void}
* */
export default function builder(config: builderDatabase, runningBuilder: runningBuilder, DB: Database, builderExitedCallback: (data: {
    id: string;
    runID: number;
    reason: "FAILED" | "SUCCESS";
}) => Promise<void>, informNewData: ()=>void, updateStatus: (status: string) => void): void {
    Logger.debug(`Starting builder with ID ${runningBuilder.dockerID} and name ${config.builder.name}`);
    //Create a new WebSocket
    const WS = new WebSocket(`ws://${runningBuilder.ip}:3000/api/v1/build`);
    const EVENT_EMITTER = new event.EventEmitter()

    try{
        if(!WS) {
            throw new Error(`Error creating WebSocket for builder ${config.builder.name} with ID ${runningBuilder.dockerID}`);
        }

        //Build the expected schema for the builder configuration
        const BUILDER_SCHEMA = {
            git: {
                noClone: config.git.noclone,
                repository: config.git.repository ? config.git.repository : '',
                branch: config.git.branch ? config.git.branch : 'main',
                gitUsername: config.git.gitusername ? config.git.gitusername : '',
                gitKey: config.git.gitkey ? config.git.gitkey : '',
                requiresAuth: config.git.requiresauth ? config.git.requiresauth : false,
            },
            buildOptions: {
                cores: config.buildoptions.cores,
                maxJobs: config.buildoptions.maxjobs,
                keep_going: config.buildoptions.keep_going,
                extraArgs: config.buildoptions.extraargs,
                substituters: config.buildoptions.substituters.split(' ').map((substituter) => substituter.trim()),
                trustedPublicKeys: config.buildoptions.trustedpublickeys.split(' ').map((key) => key.trim()),
                command: config.buildoptions.command,
                cachix: {
                    push: config.cachix.push,
                    target: `${config.cache.uri}/${config.cache.name}`,
                    apiKey: config.cachix.apikey.key,
                    signingKey: config.cachix.signingkey.privateKey,
                }
            }
        }
        fs.writeFileSync('/tmp/builder-config.json', JSON.stringify(BUILDER_SCHEMA, null, 2));
        let jobStatus = ''

        //On WebSocket open, send the builder configuration
        WS.onopen = async ()=>{
            WS.send(JSON.stringify(BUILDER_SCHEMA))
            Logger.debug(`WebSocket connection opened for builder ${config.builder.name} with ID ${runningBuilder.dockerID}, IP: ${runningBuilder.ip}`);
        }

        //On WebSocket message, handle the incoming messages
        WS.onmessage = async (event) => {
            Logger.debug(`WebSocket message received for builder ${config.builder.name} with ID ${runningBuilder.dockerID}: ${event.data.toString()}`);
            const data = JSON.parse(event.data.toString())

            if(data.jobStatus != jobStatus){
                jobStatus = data.jobStatus
                await DB.updateBuilderRun(runningBuilder.dbID, jobStatus, runningBuilder.output)
                updateStatus(jobStatus)
            }
            runningBuilder.output += `${event.data.toString()}\n`
            informNewData()
        }

        WS.onerror = async (error) => {
            Logger.error(`WebSocket error for builder ${config.builder.name} with ID ${runningBuilder.dockerID}: ${error}`);
        }

        //When a Websocket connection is closed, we need to handle it gracefully
        //This is determined by looking at the close code and reason
        WS.onclose = async (reason) => {
            if(!reason.wasClean){
                await builderExitedCallback({
                    id: runningBuilder.dockerID,
                    runID: runningBuilder.dbID,
                    reason: 'FAILED'
                })
            }
            else{
                await builderExitedCallback({
                    id: runningBuilder.dockerID,
                    runID: runningBuilder.dbID,
                    reason: 'SUCCESS'
                })
            }
        }
    }
    catch(error){

        // In case of an error we call the end() method on the WebSocket to close the connection
        // and we also call the end() function with the containerID to end the container.
        // This is most likely a fatal error, so we should set this build as failed
        Logger.error(`Error building config ${config.builder.name} with ID ${runningBuilder.dockerID}: ${error}`);
        builderExitedCallback({
            id: runningBuilder.dockerID,
            runID: runningBuilder.dbID,
            reason: 'FAILED'
        })
    }
}