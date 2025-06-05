import {Logger} from "@/lib/logger";
import {runningBuilder} from "@/types/scheduler";
import event from 'node:events';
/*
* This function handles the docker event stream and updates the running builders, etc.
* It listens for Docker events and processes them accordingly.
* @returns {Promise<void>}
* @throws {Error} If there is an error in the event stream or if no data is received
* */
export default async function dockerEventCallback(
    err: Error | null,
    data: NodeJS.ReadableStream | undefined,
    getRunningBuilders: ()=> Array<runningBuilder>,
    builderStartedCallback: (data: { id: string, name: string }) => void
) {
    if(err){
        throw new Error(err.message)
    }
    if(!data){
        Logger.error(`dockerEventCallback: No data received from Docker event stream`);
        throw new Error('dockerEventCallback: No data received from Docker event stream');
    }

    Logger.debug(`Received Docker event stream`);

    const EVENT_EMITTER = new event.EventEmitter();
    data.on('start', ()=>{
        Logger.debug(`Docker event stream started`);
    })

    //Handle the data event to process incoming Docker events
    data.on('data', async(data)=>{
        //Logger.debug(`Docker event stream data received: ${data.toString()}`);
        const RUNNING_BUILDERS = getRunningBuilders();

        try {
            //Check if this event is related to a running builder, if not we ignore it
            const event = JSON.parse(data.toString());
            if(!event || event.Type !== 'container' || !event.Actor){
                Logger.debug(`Ignoring unrelated Docker event: ${data.toString()}`);
                return
            }
            const DOCKER_NAME = event.Actor.Attributes.name || '';

            if(event.status === 'start' && DOCKER_NAME.includes('iglu-builder')){
                Logger.debug(`Docker event: New Builder started with ID ${event.id} and name ${DOCKER_NAME}`);


                builderStartedCallback({id: event.Actor.ID, name: DOCKER_NAME});
                return
            }

            const relatedBuilder = RUNNING_BUILDERS.find(builder => builder.dockerID === event.id);
            if (!relatedBuilder) {
                Logger.debug(`Ignoring Docker event for unrelated container: ${event.id}`);
                return;
            }

            if (event.status === 'start' || event.status === 'die') {
                Logger.debug(`Docker event: ${event.status} for container ${event.id}`);
            }
        } catch (error) {
            Logger.error(`Error parsing Docker event data: ${error}`);
        }
    })
}