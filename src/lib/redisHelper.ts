import Logger from "@iglu-sh/logger";
import type {NodeChannelMessage} from "@iglu-sh/types/controller";
import {createClient} from 'redis';
export function buildDeregisterMsg(
    nodeId:string,
): NodeChannelMessage {
    return {
        type: 'deregister',
        sender: 'controller',
        target: nodeId,
        data: {}
    }
}
// Create and return a connected Redis client
export async function getRedisClient(){
    const client = createClient({
        url: process.env.REDIS_URL
    })
    client.on('error', (err) => Logger.error(`Redis Client Error ${err}`));
    await client.connect()
    return client
}