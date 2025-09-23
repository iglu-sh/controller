import {getRedisClient} from "@/lib/redisHelper";
import type { NodeInfo } from "@iglu-sh/types/scheduler";
import {createClient, type RedisClientType} from "redis";
import Logger from "@iglu-sh/logger";
import type {nodeRegistrationRequest} from "@iglu-sh/types/scheduler/communication";
import type {BuildChannelMessage, BuildQueueMessage} from "@iglu-sh/types/controller";
import type {combinedBuilder} from "@iglu-sh/types/core/db";

export default class Redis{
    private redisClient:RedisClientType
    constructor() {
        Logger.debug("Constructing Redis Client");
        this.redisClient = createClient({
            url: process.env.REDIS_URL
        })
        this.redisClient.on('error', (err) => Logger.error(`Redis Client Error ${err}`));
        void this.redisClient.connect().then(()=>{
            Logger.info("Connected to Redis");
        })
    }
    public async getConnectedNodes():Promise<NodeInfo[]>{
        Logger.debug("Getting Registered Nodes from Redis");
        const keys = await this.redisClient.keys('node:*').catch((err:Error)=>{
            Logger.error(`Failed to get keys from Redis: ${err.message}`);
            return [];
        });
        const nodes:NodeInfo[] = []
        for(const key of keys){
            const node = await this.redisClient.json.get(key) as nodeRegistrationRequest
            const nodeToPush =  {
                ...node,
                id:key.replace("node:",""),
            } as NodeInfo
            if(node){
                nodes.push(nodeToPush)
            }
        }
        return nodes;
    }
    public async getBuildByID(buildID:string):Promise<combinedBuilder | null>{
        const builder = await this.redisClient.json.get(`builder:${buildID}`) as combinedBuilder
        return builder ? builder : null
    }

    /*
    * Advertises a new build job to all connected nodes.
    * The function should not be called directly, instead call the addToQueue function in this class. The function is only exposed for testing purposes.
    * The jobID is the ID of the build (i.e the id from the builder_runs table).
    * The builderID is the ID of the builder (i.e the id from the builders table).
    * */
    public async advertiseNewBuildJob(jobID:string, builderID:string){
        // Get all nodes from Redis
        const nodes = await this.getConnectedNodes()
        if(nodes.length === 0){
            // FIXME: This should end the build job with an error in the DB
            Logger.warn("No nodes connected to Redis, cannot advertise build job");
            return
        }

        // Get the builder from Redis to see if it exists
        const builder = await this.getBuildByID(builderID)

        if(!builder){
            Logger.error(`Builder with ID ${builderID} does not exist`);
            throw new Error(`Builder with ID ${builderID} does not exist`);
        }

        //FIXME: Fix linter errors here
        // Check if one node supports the buildconfig's architecture
        const supported = nodes.find((node)=>{
            return node.arch.includes(builder.builder.arch)
        })

        if(!supported){
            // FIXME: This should end the build job with an error in the DB
            Logger.error(`No nodes support the architecture ${builder.builder.arch} for builder ID ${builderID}`);
            throw new Error(`No nodes support the architecture ${builder.builder.arch} for builder ID ${builderID}`);
        }

        // Get the Build Config from Redis to see if it exists **and** what the arch is
        Logger.debug(`Advertising new build job ${jobID} for builder ${builderID} to all nodes`);

        const message:BuildChannelMessage = {
            type: "queue",
            sender: "controller",
            target: null,
            data: {
                type: "add",
                builder_id: builder.builder.id,
                job_id: jobID,
                arch: builder.builder.arch
            }
        }
        await this.redisClient.publish('node', JSON.stringify(message))
    }

    /*
    * Sends a build job to a specific node.
    * The function should not be called directly, instead call the addToQueue function in this class. The function is only exposed for testing purposes.
    * The nodeID is the ID of the node to send the job to.
    * The jobID is the ID of the builder to send.
    * Careful: This function does not check if the request is authenticated / authorized, this has to be done before calling this function.
    * */
    public async sendBuildJobToNode(nodeID:string, jobID:string, builderID:string):Promise<void>{
        // First, check if the node and builder exist
        const node = await this.redisClient.json.get(`node:${nodeID}`) as nodeRegistrationRequest
        if(!node){
            throw new Error(`Node with ID ${nodeID} does not exist`);
        }
        const builder = await this.getBuildByID(builderID)
        if(!builder){
            throw new Error(`Builder with ID ${builderID} does not exist`);
        }

        // Add the job to the node's queue
        const message:BuildChannelMessage = {
            type: "claim",
            sender: "controller",
            target: nodeID,
            data: {
                type: "claim_response",
                builder_id: builder.builder.id.toString(),
                job_id: jobID,
                result: "approved"
            }
        }
        await this.redisClient.publish('build', JSON.stringify(message))
    }

    public async quit(){
        await this.redisClient.quit()
    }
}