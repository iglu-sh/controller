import {ContainerInspectInfo} from "dockerode";

export type schedulerConfig = {
    git: {
        repository: string,
        branch: string,
        gitUsername: string,
        gitKey: string,
        requiresAuth: boolean,
        noClone: boolean,
    },
    buildOptions: {
        cores: number,
        maxJobs: number,
        keep_going: boolean,
        extraArgs: string,
        substituters: Array<string>,
        trustedPublicKeys: Array<string>,
        command: string,
        cachix: {
            push: boolean,
            target: string,
            apiKey: string,
            signingKey: string,
        }
    }
}

export type runningBuilder = {
    id:number,
    dockerID: string,
    dockerInfo: ContainerInspectInfo,
    ip: string,
    dbID: number,
    output: Buffer
}