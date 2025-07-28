import type {NodeChannelMessage} from "@iglu-sh/types/controller";

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