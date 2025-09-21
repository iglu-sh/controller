import {getRedisClient} from "@/lib/redisHelper";
import type { NodeInfo } from "@iglu-sh/types/scheduler";
import {createClient, type RedisClientType} from "redis";
import Logger from "@iglu-sh/logger";
import type {nodeRegistrationRequest} from "@iglu-sh/types/scheduler/communication";

export class redis{
    private redisClient:RedisClientType
    constructor() {
        this.redisClient = createClient({
            url: process.env.REDIS_URL
        })
        this.redisClient.on('error', (err) => Logger.error(`Redis Client Error ${err}`));
        void this.redisClient.connect()
    }
    public async getConnectedNodes():Promise<NodeInfo[]>{
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
    public async quit(){
        await this.redisClient.quit()
    }
}