/*
* This file is responsible for creating and managing the builders
* */

import Scheduler from './scheduler';
import {BunRequest} from "bun";

new Scheduler();
const schedulerinterface = process.env.SCHEDULER_INTERFACE
const schedulerport = process.env.SCHEDULER_PORT || '3000';
const authkey = process.env.SCHEDULER_AUTHKEY;

const isAuthenticated = (req:BunRequest) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return false;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token === authkey;
}


console.log(`> Scheduler: Starting on http://${schedulerinterface}:${schedulerport}`);
Bun.serve({
    routes: {
        '/': async (req) => {
            return new Response('Scheduler is running', { status: 200 });
        },
        '/refresh': async (req) => {
            if (!isAuthenticated(req)) {
                return new Response('Unauthorized', { status: 401 });
            }
            try {
                await Scheduler.refreshBuilderConfig();
                return new Response('Builder config refreshed', { status: 200 });
            } catch (error) {
                console.error('Error refreshing builder config:', error);
                return new Response('Failed to refresh builder config', { status: 500 });
            }
        },
    },
    port: parseInt(schedulerport),
    hostname: schedulerinterface,
})