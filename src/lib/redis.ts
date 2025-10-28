import type { NodeInfo } from "@iglu-sh/types/scheduler";
import {createClient, type RedisClientType} from "redis";
import Logger from "@iglu-sh/logger";
import type {nodeRegistrationRequest} from "@iglu-sh/types/scheduler/communication";
import type {arch, BuildChannelMessage, BuildQueueMessage} from "@iglu-sh/types/controller";
import type {combinedBuilder} from "@iglu-sh/types/core/db";
import Database from "@/lib/db";

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
    /*
    * Removes and then re-adds all builders from the database to Redis.
    * */
    public async refreshBuilders():Promise<void>{
        // Remove all builders from Redis
        Logger.debug("Refreshing Builders in Redis");
        const keys = await this.redisClient.keys('build_config_*').catch((err:Error)=>{
            Logger.error(`Failed to get keys from Redis: ${err.message}`);
            return [];
        });
        for(const key of keys){
            await this.redisClient.del(key).catch((err:Error)=>{
                Logger.error(`Failed to delete key ${key} from Redis: ${err.message}`);
            });
        }
        Logger.debug("Deleted all builders from Redis");
        // Get all builders from the database
        const db = new Database()
        try{
            await db.connect()
            const builders = await db.getAllBuilders()
            for(const builder of builders.rows){
                await this.redisClient.json.set(`build_config_${builder.builder.id}`, '.', builder).catch((err:Error)=>{
                    Logger.error(`Failed to set builder ${builder.builder.id} in Redis: ${err.message}`);
                });
            }
            await db.disconnect()
        }
        catch(e){
            await db.disconnect()
            Logger.error(`Failed to connect to DB ${e}`);
            throw e;
        }
    }
    public async getConnectedNodes():Promise<NodeInfo[]>{
        Logger.debug("Getting Registered Nodes from Redis");
        const keys = await this.redisClient.keys('node:*:info').catch((err:Error)=>{
            Logger.error(`Failed to get keys from Redis: ${err.message}`);
            return [];
        });
        const nodes:NodeInfo[] = []
        for(const key of keys){
            const node = await this.redisClient.json.get(key) as nodeRegistrationRequest
            const nodeToPush =  {
                ...node,
                id:key.replace("node:","").replace(":info","")
            } as NodeInfo
            if(node){
                nodes.push(nodeToPush)
            }
        }
        return nodes;
    }
    public async getBuildByID(buildID:string):Promise<combinedBuilder | null>{
        const builder = await this.redisClient.json.get(`build_config_${buildID}`) as combinedBuilder
        return builder ? builder : null
    }
    public async getQueueLength():Promise<number>{
        const length = await this.redisClient.lLen('build_queue').catch((err:Error)=>{
            Logger.error(`Failed to get queue length from Redis: ${err.message}`);
        });
        return length ?? 0
    }
    public async getQueue():Promise<Array<{published_at:number, job:BuildChannelMessage}>>{
        const queue = await this.redisClient.lRange('build_queue', 0, -1).then((res:string[])=>{
            return res.map((item:string)=>{
                return JSON.parse(item) as {published_at:number, job:BuildChannelMessage}
            })
        })
        return queue ?? []
    }
    public async removeItemFromQueue(queueId:string):Promise<void>{
        const queue = await this.getQueue()
        const item = queue.find((item)=>(item.job.data as BuildQueueMessage).job_id === queueId) as {published_at:number, job:BuildChannelMessage} | undefined
        if(!item){
            throw new Error(`Item with ID ${queueId} not found in queue`);
        }
        // Remove the item from the queue
        await this.redisClient.lRem('build_queue', 1, JSON.stringify(item)).catch((err:Error)=>{
            Logger.error(`Failed to remove item from queue in Redis: ${err.message}`);
        })
        Logger.debug(`Removed item with ID ${queueId} from queue`);
    }

    /*
    * Advertises a new build update to all connected nodes.
    * The function should not be called directly, instead call the addToQueue function in this class. The function is only exposed for testing purposes.
    * The jobID is the ID of the build (i.e the id from the builder_runs table).
    * The builderID is the ID of the builder (i.e the id from the builders table).
    * */
    public async advertiseNewBuildJob(jobID:string, builderID:string){
        // Get all nodes from Redis
        const nodes = await this.getConnectedNodes()
        if(nodes.length === 0){
            // FIXME: This should end the build update with an error in the DB
            Logger.warn("No nodes connected to Redis, cannot advertise build update");
            return
        }

        // Get the builder from Redis to see if it exists
        const builder = await this.getBuildByID(builderID)
        if(!builder){
            Logger.error(`Builder with ID ${builderID} does not exist`);
            throw new Error(`Builder with ID ${builderID} does not exist`);
        }

        // Check if one node supports the buildconfig's architecture
        const supported = nodes.find((node)=>{
            return node.node_arch.includes(builder.builder.arch as arch)
        })

        if(!supported){
            // FIXME: This should end the build update with an error in the DB
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
                builder_id: builder.builder.id.toString(),
                job_id: jobID,
                target: null,
                arch: builder.builder.arch as arch
            }
        }

        const db = new Database()
        try{
            await db.connect()
            // Get the job_run from the database and try to update it later on
            const builder_run = await db.getJob(parseInt(jobID))
            if(!builder_run){
                throw new Error(`Builder run with ID ${jobID} does not exist in the database`);
            }

            // Add to the queue list in Redis
            await this.redisClient.lPush('build_queue', JSON.stringify({
                "published_at": Date.now(),
                "job": message
            }))

            await this.redisClient.publish('build', JSON.stringify(message))
            builder_run.status = "queued"

            // Update the builder_run status to queued
            await db.updateJob(builder_run.id, builder_run)
            await db.disconnect()
        }
        catch(e){
            Logger.error("Error whilst advertising new build update")
            Logger.debug(`${e}`)
            await db.disconnect()
        }
    }

    /*
    * Sends a build update to a specific node.
    * The function should not be called directly, instead call the addToQueue function in this class. The function is only exposed for testing purposes.
    * The nodeID is the ID of the node to send the update to.
    * The jobID is the ID of the builder to send.
    * Careful: This function does not check if the request is authenticated / authorized, this has to be done before calling this function.
    * */
    public async respondToBuildClaim(nodeID:string, jobID:string, builderID:string, result:"approved" | "rejected"):Promise<void>{
        // First, check if the node and builder exist
        const node = await this.redisClient.json.get(`node:${nodeID}:info`) as nodeRegistrationRequest
        if(!node){
            throw new Error(`Node with ID ${nodeID} does not exist`);
        }
        const builder = await this.getBuildByID(builderID)
        if(!builder){
            throw new Error(`Builder with ID ${builderID} does not exist`);
        }

        // Add the update to the node's queue
        const message:BuildChannelMessage = {
            type: "claim",
            sender: "controller",
            target: nodeID,
            data: {
                type: "claim_response",
                builder_id: builder.builder.id.toString(),
                job_id: jobID,
                result: result
            }
        }
        await this.redisClient.publish('build', JSON.stringify(message))
    }
    public async getNodeInfo(nodeID:string):Promise<NodeInfo> {
        const node = await this.redisClient.json.get(`node:${nodeID}:info`) as nodeRegistrationRequest
        if(!node){
            throw new Error(`Node with ID ${nodeID} does not exist`);
        }
        return {
            ...node,
            id: nodeID
        } as NodeInfo
    }
    public async awardJobToNode(nodeID:string, jobID:string):Promise<void>{
        // First, check if the update is still in the queue
        const queue = await this.getQueue()
        const job = queue.find((item)=>(item.job.data as BuildQueueMessage).job_id === jobID)
        if(!job){
            throw new Error(`Job with ID ${jobID} is not in the queue (anymore)`);
        }
        // Found the update, remove it from the queue
        await this.removeItemFromQueue(jobID)

        // Add the update to the node's queued builds
        await this.respondToBuildClaim(nodeID, jobID, (job.job.data as BuildQueueMessage).builder_id, "approved")

        // Update the update status in the database
        const db = new Database()
        try{
            await db.connect()
            const builder_run = await db.getJob(parseInt(jobID))
            builder_run.status = "claimed"
            builder_run.node = nodeID
            await db.updateJob(builder_run.id, builder_run)
            await db.disconnect()
        }
        catch(e){
            Logger.error(`Error while updating job ${jobID}`)
            Logger.debug(`${e}`)
            await db.disconnect()
        }
    }
    public async quit(){
        await this.redisClient.quit()
    }

}