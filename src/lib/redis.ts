import {getRedisClient} from "@/lib/redisHelper";
import type { NodeInfo } from "@iglu-sh/types/scheduler";
import {createClient, type RedisClientType} from "redis";
import Logger from "@iglu-sh/logger";
import type {nodeRegistrationRequest} from "@iglu-sh/types/scheduler/communication";
import type {BuildChannelMessage, BuildQueueMessage} from "@iglu-sh/types/controller";

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

    public async advertiseNewBuildJob(jobID:string, builderID:string){
        const message:BuildChannelMessage = {
            type: "build",
            sender: "controller",
            target: null,
            data: {
                type: "add",
                build_id: jobID,
                config_id: builderID,
                target: null,
                arch: "aarch64"
            } as BuildQueueMessage
        }
    }

    /*
    * Sends a build job to a specific node.
    * The function should not be called directly, instead call the addToQueue function in this class. The function is only exposed for testing purposes.
    * The nodeID is the ID of the node to send the job to.
    * The jobID is the ID of the builder to send.
    * Careful: This function does not check if the request is authenticated / authorized, this has to be done before calling this function.
    * */
    public async sendBuildJobToNode(nodeID:string, jobID:string):Promise<void>{
        // First, check if the node and builder exist
        const node = await this.redisClient.json.get(`node:${nodeID}`) as nodeRegistrationRequest
        if(!node){
            throw new Error(`Node with ID ${nodeID} does not exist`);
        }
        const builder = await this.redisClient.json.get(`builder:${node.builder_id}`)
        if(!builder){
            throw new Error(`Builder with ID ${node.builder_id} does not exist`);
        }

        // Add the job to the node's queue
        const message:BuildChannelMessage = {
            type: "claim",
            job_id: jobID,
            sender: "controller",
            target: nodeID,
            data: {
                type: "claim_response",
                build_id: jobID,
                result: "approved"
            }
        }
        await this.redisClient.publish('node', JSON.stringify(message))
    }

    public async quit(){
        await this.redisClient.quit()
    }
}