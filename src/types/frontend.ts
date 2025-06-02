export type PublicSigningKey = {
    id: number,
    name: string,
    key: string,
    description: string
    created_at: Date
}
export type FrontendKey = {
    publicsigningkeys: Array<PublicSigningKey>,
    //Cache Name and ID
    name: string,
    id: string
}

export type CacheCreationRequest = {
    name: string,
    githubUsername: string,
    public: boolean,
    compression: "XZ" | "ZSTD",
    priority: number,
    enableBuilder: boolean,
    publicSigningKey: number
}
export type Substituter = {
    url: string,
    //If a string is passed, store as string, if a number is passed, this means a configured cache on this cache server should be used
    signingKeys: Array<string>,
}
export type BuilderCreationRequest = {
    name: string,
    description: string,
    git: {
        noClone:boolean,
        url: string,
        branch: string,
        requiresAuth: boolean,
        username: string,
        token: string
    },
    build: {
        command: string,
        buildTrigger: "manual" | "webhook" | "cron",
        cron?: string,
        outputDir: string
        allowUnfree: boolean
        parallelBuilds: boolean
        sandboxed: boolean
        maxJobs: number
        cores: number
        substituters: Array<Substituter>
    },
    cachix: {
        mode: "manual" | "auto",
        cachixPublicSigningKey?: string,
        cachixSigningKey?: string,
        push: boolean
    },

}