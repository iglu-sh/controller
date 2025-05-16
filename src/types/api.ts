export type cache = {
    id: number,
    githubusername: string,
    ispublic: boolean,
    name: string,
    permission: string,
    preferredcompressionmethod: string,
    publicsigningkeys: string,
    allowedkeys: string[],
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