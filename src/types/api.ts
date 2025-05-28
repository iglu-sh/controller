export type cache = {
    id: number,
    githubusername: string,
    ispublic: boolean,
    name: string,
    permission: string,
    preferredcompressionmethod: string,
    publicsigningkeys: string,
    uri: string,
    priority: number
    problems: problem[]
}

export type problem = {
    "heading" : string,
    "description" : string,
}

export type cacheCreationObject = {
    name: string,
    githubUsername: string,
    isPublic: boolean,
    enableBuilder: boolean,
    compression: string,
    priority: number,
    publicSigningKey: string,
}

export type cacheRequestLog = {
    id: string,
    hash: string,
    cache_id: string,
    type: 'inbound' | 'outbound',
    time: string
}

export type requestAggregatedResponseType = {
    time: string,
    total: number,
    type: 'inbound' | 'outbound'
}
export type cacheInfoObject = {
    cache: cache,
    storage: {
        storageUsed: number,
        storeHashes: number,
    },
    request: Array<requestAggregatedResponseType>
}

export type hash = {
    id: number,
    path: string,
    cache: number,
    updatedat: string,
    cderiver:string,
    cfilehash:string,
    cfilesize:string,
    creferences:string,
    csig:string,
    cstorehash:string,
    cstoresuffix:string,
    parts:string,
    compression: 'xz' | 'zstd'
}

export interface topRequestHashType extends hash {
    total: number
}

export type userInfoObject = {
    caches: Array<cache>,
    newestCashedHashes: Array<hash>,
    topRequestedHashes: Array<topRequestHashType>,
    biggestCaches: Array<{cache:number, size:number}>,
    hashCount: number,
}

export type key = {
    id: number,
    cache_id: number,
    created_at: string,
    permissions: string,
    name: string,
    description: string,
}

export type derivation = {
    id: number,
    path: string,
    cache: number,
    updatedat: Date,
    cderiver: string,
    cfilehash: string,
    cfilesize: string,
    cnarhash: string,
    cnarsize: string,
    creferences: Array<string>,
    csig: string,
    cstorehash: string,
    cstoresuffix: string,
    parts: Array<{eTag:string, partNumber:number}>,
    compression: 'xz' | 'zstd',
    last_accessed: null | Date,
    hits: string
}

export type builderRun = {
    status: 'success' | 'failure' | 'running',
    time: Date,
    gitCommit: string,
    duration: number, // in seconds
}

export type builder = {
    id: number,
    name: string,
    description: string,
    runs: Array<builderRun>,
    git: {
        repository: string,
        branch: string,
        gitUsername: string,
        gitKey: string,
        requiresAuth: boolean,
        noClone: boolean,
    },
    enabled: boolean,
    trigger: 'manual' | 'cron' | 'webhook',
    schedule: string,
    buildOptions: {
        cores: number,
        maxJobs: number,
        keep_going: boolean,
        extraArgs: string,
        substituters: Array<string>,
        trustedPublicKeys: Array<string>,
        command:string,
        cachix: {
            push: boolean,
            target: string,
            apiKey: string,
            signingKey: string,
            cachixPushSourceDir: string,
        }
    }
}