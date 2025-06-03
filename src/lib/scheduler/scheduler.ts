import {builder} from "@/types/api";
import Database from "@/lib/db";
import dotenv from "dotenv";
import {builderDatabase} from "@/types/db";
import Docker, {ContainerInfo, ContainerInspectInfo} from 'dockerode'
import DockerEvents from 'docker-events';
import assert from "node:assert";
import {schedulerConfig} from "@/types/scheduler";

export default class Scheduler {
    static builderConfig:Array<builderDatabase>
    static db:Database
    static emmiter:DockerEvents;
    static runningBuilders:Array<{
        id: number,
        dockerID: string,
        dockerInfo: ContainerInspectInfo,
        ip: string,
        dbID: number,
        output?: string
    }> = []

    //This array holds the queue for all jobs that exceed the maximum limit of builders configured
    static queue:Array<number> = []
    static docker:Docker;
    static maxBuilders:number = parseInt(process.env.MAX_BUILDERS || '5')

    /*
    * The Scheduler class is a manager class responsible for managing all the builders and the respective activation methods.
    * */
    constructor() {
        if(Scheduler.db) return
        dotenv.config()
        console.log('> Scheduler: Initializing Scheduler')
        Scheduler.db = new Database()
        Scheduler.builderConfig = []
        Scheduler.docker = new Docker({
            socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'
        })
        Scheduler.setup()
    }

    /*
    * Sets up the scheduler by creating the necessary database tables for the frontend and populates the builderConfigs
    * */
    static async setup(){
        await Scheduler.db.createFrontendTables()

        await Scheduler.refreshBuilderConfig()
        //Register a process exit handler to close the database connection
        process.on('exit', async (code:any, signal:any)=>{
            console.log(`> Scheduler: Exiting with code ${code}`)
            assert(Scheduler.db, 'Scheduler.db is not initialized')
            await Scheduler.db.close()
        })
        Scheduler.docker.getEvents(async (err, stream) => {
            console.log(`> Scheduler: Listening for Docker events`);
            if (err) {
                console.error("Error getting Docker events", err);
                return;
            }
            if (!stream) {
                console.error("No Docker event stream available");
                return;
            }
            stream.on('start', () => {
                console.log('> Scheduler: Docker event stream started');
            });
            stream.on('data', async (data) => {
                try {
                    const event = JSON.parse(data.toString());
                    //console.log('> Scheduler: Docker event received:', event);

                    // Ensure the event is related to containers
                    if (event.Type === 'container' && event.Actor && event.Actor?.ID && event.Actor?.Attributes) {
                        console.log(`> Scheduler: Container event detected: ${event.Action}`);

                        // Check if the container is a builder
                        const containerID = event.Actor.ID;
                        const containerName = event.Actor.Attributes.name
                        if(!containerName.startsWith('iglu-builder-')) {
                            console.log(`> Scheduler: Ignoring event for non-builder container: ${containerName}`);
                            return;
                        }


                        if (event.Action === 'start') {
                            const dockerContainer = Scheduler.docker.getContainer(containerID);
                            const dockerInfo: ContainerInspectInfo = await dockerContainer.inspect();

                            console.log(`> Scheduler: Managed Container ${event.Actor.ID} started`);
                            //Start the build in the database
                            const builderRunID = await Scheduler.db.createBuilderRun(parseInt(containerName.split('-')[2]), '', 'running', '')
                            //Add the docker to the running builders
                            console.log(`> Scheduler: Got builder run id: ${builderRunID}`)
                            Scheduler.runningBuilders.push({
                                id: parseInt(containerName.split('-')[2]),
                                dockerID: containerID,
                                dockerInfo: dockerInfo,
                                ip: dockerInfo.NetworkSettings?.IPAddress || '',
                                dbID: builderRunID,
                                output: ''
                            });

                            //Call the startup method for the builder
                            Scheduler.startupDocker(containerID, containerName.split('-')[2])
                        }

                        if (['die', 'kill', 'exited'].includes(event.Action)) {
                            console.log(`> Scheduler: Container ${event.Actor.ID} exited`);

                            //Remove the container from the running builders
                            const index = Scheduler.runningBuilders.findIndex((b) => b.dockerID === containerID);
                            if (index !== -1) {
                                const builderID = Scheduler.runningBuilders[index].id;

                                const status = event.Action === 'die' || event.Action === 'kill' ? 'failure' : 'success';

                                //Update the builder run status in the database
                                await Scheduler.db.updateBuilderRun(Scheduler.runningBuilders[index].dbID, status, Scheduler.runningBuilders[index].output || '');

                                Scheduler.runningBuilders.splice(index, 1);
                                console.log(`> Scheduler: Removed builder with id ${builderID} from running builders`);

                                //Re-process the queue to start the next build if available
                                await Scheduler.updateQueue();
                            } else {
                                console.log(`> Scheduler: Container ${containerID} not found in running builders`);
                            }
                        }
                    }
                } catch (error) {
                    console.error('> Scheduler: Failed to parse Docker event:', error);
                }
            });
        });


        await Scheduler.docker.pull(`ghcr.io/iglu-sh/iglu-builder:v0.0.1`, (err:any, stream:any) => {
            if (err) {
                console.error(`> Scheduler: Failed to pull Docker image:`, err);
                throw err;
            }
            // Wait for the image to be pulled
            Scheduler.docker.modem.followProgress(stream, (err, res) => {
                if (err) {
                    console.error(`> Scheduler: Error pulling Docker image:`, err);
                    throw err;
                }
                console.log(`> Scheduler: Docker image pulled successfully`);
            });
        })
        await Scheduler.startBuild(1)
        return
    }

    static async startupDocker(dockerID:string, builderID:string){

        //Connect to the IP address of the dockerID
        const dockerInfo = Scheduler.runningBuilders.find((b) => b.dockerID === dockerID);
        if(!dockerInfo) {
            console.error(`> Scheduler: Docker container with ID ${dockerID} not found in running builders`);
            return;
        }
        const builder = Scheduler.builderConfig.find((b) => b.builder.id === parseInt(builderID));
        if(!builder) {
            console.error(`> Scheduler: Builder with ID ${builderID} not found in builder config`);
            return;
        }

        const ip = dockerInfo.ip;

        assert(ip, '> Scheduler: Docker container IP address is not available');
        console.log(JSON.parse(builder.cachix.signingkey))
        //Send the config via the Websocket
        const config:schedulerConfig = {
            git: {
                noClone: builder.git.noclone,
                repository: builder.git.repository ? builder.git.repository : '',
                branch: builder.git.branch ? builder.git.branch : '',
                gitUsername: builder.git.gitusername ? builder.git.gitusername : '',
                gitKey: builder.git.gitkey ? builder.git.gitkey : '',
                requiresAuth: builder.git.requiresauth ? builder.git.requiresauth : false,
            },
            buildOptions: {
                cores: builder.buildoptions.cores,
                maxJobs: builder.buildoptions.maxjobs,
                keep_going: builder.buildoptions.keep_going,
                extraArgs: builder.buildoptions.extraargs,
                substituters: builder.buildoptions.substituters.split(" "),
                trustedPublicKeys: builder.buildoptions.trustedpublickeys.split(" "),
                command: builder.buildoptions.command,
                cachix: {
                    push: builder.cachix.push,
                    target: `${builder.cache.uri}/${builder.cache.name}`,
                    apiKey: JSON.parse(builder.cachix.apikey).key,
                    signingKey: JSON.parse(builder.cachix.signingkey).privateKey,
                }
            },
        }

        console.log(`> Scheduler: Sending startup message for Docker container ${dockerID} with builder ID ${builderID}`);

        //Connect via websocket
        const index = Scheduler.runningBuilders.findIndex((b) => b.dockerID === dockerID);
        await new Promise(resolve => setTimeout(resolve, 5000))
        let ws = new WebSocket(`ws://${ip}:3000/api/v1/build`, {
            headers: {
                'Content-Type': 'application/json',
                'Builder-ID': builderID,
                'Docker-ID': dockerID
            }
        });
        console.log(ws.url)
        ws.addEventListener('error', async (e)=>{
            console.error(`> Scheduler: WebSocket error for Docker container ${dockerID}:`, e);

            let i = 0;
            let isConnected = false;
            //Try and reconnect to the container up to 5 times with a delay of 5 seconds, if it fails, we kill the builder
            for(; i < 5; i++) {
                console.log(`> Scheduler: Retrying WebSocket connection to Docker container ${dockerID} (${i + 1}/5)`);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
                ws = new WebSocket(`ws:/${ip}:3000/api/v1/build`);
                if(ws.readyState === WebSocket.OPEN) {
                    console.log(`> Scheduler: Reconnected to Docker container ${dockerID}`);
                    break;
                }
            }

            if(!isConnected){
                //Kill the builder
                Scheduler.kill(Scheduler.runningBuilders[index].id, dockerID).catch(err => {
                    console.error(`> Scheduler: Failed to kill builder with id ${Scheduler.runningBuilders[index].id}:`, err);
                });
            }
        })
        ws.addEventListener('open', ()=>{
            console.log(`WebSocket connection established to ws://${ip}:3000`);
        })
        ws.onopen = () => {
            console.log('ESTABLISHED')
            ws.send(JSON.stringify(config))
        }
        ws.onmessage = (async (message)=>{
            console.log(message);
            //Add this message to the output of the builder
            const output = message.toString();
            Scheduler.runningBuilders[index].output += `${output}\n`;
        })
    }
    /*
    * This refreshes the builderConfig by fetching the latest builders from the database
    * */
    static async refreshBuilderConfig(){
        assert(Scheduler.db, 'Scheduler.db is not initialized')
        console.log(`> Scheduler: Refreshing builder config`)

        //Set the builderConfig to an empty array
        Scheduler.builderConfig = []

        //Fetch all the configured builders from the database and populate the builderConfig array
        Scheduler.builderConfig = await Scheduler.db.getAllBuilders()
        console.log(`> Scheduler: Found ${Scheduler.builderConfig.length} builders`)

        //Loop over the builderConfig and register each builder (that has a cron schedule)
        for(const builder of Scheduler.builderConfig){
            if(builder.builder.trigger === "cron"){
                console.log(`> Scheduler: Registering cronjob for builder with id ${builder.builder.id}`)
            }
        }
    }

    /*
    * This creates the docker builder with the given id and adds the id of the builder config to the runningBuilders ID
    * */
    static async queueBuild(builderID:number){
        assert(Scheduler.db, 'Scheduler.db is not initialized')
        assert(Scheduler.docker, 'Scheduler.docker is not initialized')
        console.log(`> Scheduler: Queuing build for builder with id ${builderID}`)

        //Check if the builder is already running
        const existingBuilder = Scheduler.runningBuilders.find((b) => b.id === builderID);

        //Check if this builder's id is in the builderConfig
        const builderConfig = Scheduler.builderConfig.find((b) => b.builder.id === builderID);
        if(!builderConfig) {
            throw new Error(`Builder with id ${builderID} is not configured`)
        }

        //If parallelBuilds is disabled we need to first try and kill the existing builder
        if(existingBuilder && !builderConfig.buildoptions.parallelbuilds) {
            console.log(`> Scheduler: Builder with id ${builderID} is already running, killing it`)
            await Scheduler.kill(builderID, existingBuilder.dockerID);
            return;
        }

        //Add the builderID to the queue
        Scheduler.queue.push(builderID);
    }

    /*
    * Kills a builder with the given id and removes the id from the runningBuilders ID
    * */
    static async kill(builderID:number, dockerID:string) {
        assert(Scheduler.db, 'Scheduler.db is not initialized')
        assert(Scheduler.docker, 'Scheduler.docker is not initialized')
        console.log(`> Scheduler: Killing builder with id ${builderID}`)

        //Check if the builder is running
        const index = Scheduler.runningBuilders.findIndex((b) => b.id === builderID);
        if(index === -1) {
            throw new Error(`Builder with id ${builderID} is not running`)
        }
        //Kill the docker container with the given id
        try {
            const container = Scheduler.docker.getContainer(dockerID);
            await container.kill();
            await container.remove();
            console.log(`> Scheduler: Killed builder with id ${builderID} and docker ID ${dockerID}`);

            //Re-process the queue
            Scheduler.updateQueue()
        } catch (error) {
            console.error(`> Scheduler: Failed to kill builder with id ${builderID}:`, error);
        }
    }


    /*
    * Reprocesses the queue after a status change and starts the next builder if there are available slots
    * */
    static async updateQueue(){
        //Check if there are any builders in the queue (if there are no builders in the queue, we don't need to do anything)
        if(Scheduler.queue.length === 0) {
            console.log(`> Scheduler: No builders in the queue`)
            return;
        }

        //Check if there are any available slots for builders
        const availableSlots = Scheduler.maxBuilders - Scheduler.runningBuilders.length;
        if(availableSlots <= 0) {
            console.log(`> Scheduler: No available slots for builders, queueing builds`)
            return;
        }

        //If there are available slots, we start from the start of the queue and process the next available builders up to the limit of available slots
        for(let i = 0; i < availableSlots && Scheduler.queue.length > 0; i++) {
            const builderID = Scheduler.queue.shift(); //Get the next builder from the queue
            if(builderID === undefined) continue; //If the builderID is undefined, we skip this iteration

            //Start the build for the builder with the given id
            await Scheduler.startBuild(builderID);
        }
    }

    static async startBuild(builderID:number){
        assert(Scheduler.db, 'Scheduler.db is not initialized')
        assert(Scheduler.docker, 'Scheduler.docker is not initialized')

        //Get the builderConfig for the given builderID
        const builderConfig = Scheduler.builderConfig.find((b) => b.builder.id === builderID);
        if(!builderConfig) {
            throw new Error(`Builder with id ${builderID} is not configured`);
        }

        console.log(`> Scheduler: Starting build for builder with id ${builderID}`)

        //Create the docker container for the builder
        let containerName = `iglu-builder-${builderID}-${Bun.randomUUIDv7()}`;
        Scheduler.docker.run(`ghcr.io/iglu-sh/iglu-builder:v0.0.1`, [], [process.stdout, process.stderr], {Tty: false, name: containerName}, async (err, data)=>{
            if(err) {
                console.error(`> Scheduler: Failed to start builder with id ${builderID}:`, err);
                return;
            }
        })

    }
}

